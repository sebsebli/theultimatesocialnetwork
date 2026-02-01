/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  OnModuleInit,
  Optional,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ollama } from 'ollama';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type Redis from 'ioredis';
// zod-to-json-schema declares Zod v3 types; we use Zod v4.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schemaToFormat = (s: z.ZodTypeAny): object => zodToJsonSchema(s as any);
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { ModerationReasonCode } from '../entities/moderation-record.entity';
import { EmbeddingService } from '../shared/embedding.service';
import {
  simhash64,
  hammingDistance,
  simhashToString,
  simhashFromString,
} from './simhash.util';
import { moderationStageCounter, moderationDuration } from '../common/metrics';

export type ModerationResult = {
  safe: boolean;
  reason?: string;
  confidence: number;
  needsStage2?: boolean;
  reasonCode?: ModerationReasonCode;
};

/** Zod schema for text moderation – structured output only (ollama.chat format). */
const ModerationTextSchema = z.object({
  safe: z.boolean(),
  reason: z.string(),
  confidence: z.number(),
  reasonCode: z
    .enum([
      'SPAM',
      'ADVERTISING',
      'HARASSMENT',
      'REPEATED',
      'VIOLENCE',
      'HATE',
      'OTHER',
    ])
    .optional(),
});

const ModerationImageSchema = z.object({
  safe: z.boolean(),
  reason: z.string(),
  confidence: z.number(),
});

function getConfig() {
  return {
    minSimilarCount:
      parseInt(process.env.MODERATION_MIN_SIMILAR_COUNT || '2', 10) || 2,
    similarityThreshold:
      parseFloat(process.env.MODERATION_SIMILARITY_THRESHOLD || '0.92') || 0.92,
    maxRecentItems:
      parseInt(process.env.MODERATION_MAX_RECENT_ITEMS || '10', 10) || 10,
    simhashHammingMax:
      parseInt(process.env.MODERATION_SIMHASH_HAMMING_MAX || '3', 10) || 3,
    simhashCacheSize:
      parseInt(process.env.MODERATION_SIMHASH_CACHE_SIZE || '20', 10) || 20,
    ollamaChatTimeoutMs:
      parseInt(process.env.OLLAMA_CHAT_TIMEOUT_MS || '8000', 10) || 8000,
    ollamaImageTimeoutMs:
      parseInt(process.env.OLLAMA_IMAGE_TIMEOUT_MS || '15000', 10) || 15000,
  };
}

const SIMHASH_REDIS_KEY_PREFIX = 'mod:simhash:';

/**
 * Production-grade content moderation: fast stages first, LLM last.
 * Stage 1: exact dup → SimHash near-dup (Redis) → embedding similarity (1 batch call).
 * Stage 2: single Ollama chat with structured JSON. All external calls time-bounded; never throws.
 *
 * Redis is required (SharedModule). On Redis connection failure during a check, SimHash fails open
 * (log and continue). EmbeddingService is optional: if not injected (null), the embedding-similarity
 * step is skipped. No step throws on embedding or transient Redis failure—we fail open for that stage.
 */
@Injectable()
export class ContentModerationService implements OnModuleInit {
  private readonly logger = new Logger(ContentModerationService.name);
  private hasTextModel = false;
  private hasImageModel = false;
  private ollama: Ollama;

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @Optional()
    @Inject(EmbeddingService)
    private embeddingService: EmbeddingService | null,
    @Inject('REDIS_CLIENT')
    private redis: Redis,
  ) {
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.ollama = new Ollama({ host });
  }

  async onModuleInit() {
    await this.checkOllamaModels();
  }

  private async checkOllamaModels() {
    try {
      const list = await this.ollama.list();
      const names = (list.models ?? []).map((m) => m.name ?? '');
      this.hasTextModel = names.some(
        (n: string) =>
          n.includes('qwen2.5') || n.includes('gemma') || n.includes('llama'),
      );
      this.hasImageModel = names.some(
        (n: string) =>
          n.includes('qwen2-vl') ||
          n.includes('moondream') ||
          n.includes('llava') ||
          n.includes('minicpm'),
      );
      this.logger.log(
        `Ollama: text=${this.hasTextModel}, image=${this.hasImageModel}`,
      );
    } catch (e: unknown) {
      this.logger.warn('Ollama unavailable', (e as Error).message);
    }
  }

  /** Exact or near-duplicate text (DB). */
  private async checkRepeatedContent(
    text: string,
    userId: string,
  ): Promise<{ isRepeated: boolean; count: number }> {
    const end = moderationDuration.startTimer({ stage: 'exact_dup' });
    try {
      const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
      const [posts, replies] = await Promise.all([
        this.postRepo.find({
          where: { authorId: userId },
          select: ['body'],
          take: 20,
        }),
        this.replyRepo.find({
          where: { authorId: userId },
          select: ['body'],
          take: 20,
        }),
      ]);
      let count = 0;
      for (const item of [...posts, ...replies]) {
        const existing = item.body.toLowerCase().trim().replace(/\s+/g, ' ');
        if (
          existing === normalizedText ||
          (existing.length > 20 && existing.includes(normalizedText))
        ) {
          count++;
        }
      }
      end();
      return { isRepeated: count >= 2, count };
    } catch (e) {
      end();
      this.logger.warn('checkRepeatedContent failed', (e as Error).message);
      return { isRepeated: false, count: 0 };
    }
  }

  /** SimHash near-duplicate (fast, in-process + Redis). No network. */
  private async checkSimHashNearDuplicate(
    userId: string,
    text: string,
  ): Promise<boolean> {
    const cfg = getConfig();
    const key = `${SIMHASH_REDIS_KEY_PREFIX}${userId}`;
    const h = simhash64(text);
    const hStr = simhashToString(h);

    try {
      const list = await this.redis.lrange(key, 0, -1);
      for (const s of list) {
        try {
          const existing = simhashFromString(s);
          if (hammingDistance(h, existing) <= cfg.simhashHammingMax) {
            moderationStageCounter.inc({ stage: 'simhash_dup' });
            return true;
          }
        } catch {
          // skip invalid entry
        }
      }
      await this.redis.lpush(key, hStr);
      await this.redis.ltrim(key, 0, cfg.simhashCacheSize - 1);
    } catch (e) {
      this.logger.warn('SimHash Redis check failed', (e as Error).message);
    }
    return false;
  }

  /** Embedding similarity: one batch embed call. */
  private async checkSimilarContentWithEmbeddings(
    userId: string,
    text: string,
  ): Promise<{ isSimilar: boolean; similarCount: number }> {
    const cfg = getConfig();
    if (!this.embeddingService) return { isSimilar: false, similarCount: 0 };

    const end = moderationDuration.startTimer({ stage: 'embedding' });
    try {
      const [posts, replies] = await Promise.all([
        this.postRepo.find({
          where: { authorId: userId },
          select: ['body'],
          take: 6,
          order: { createdAt: 'DESC' },
        }),
        this.replyRepo.find({
          where: { authorId: userId },
          select: ['body'],
          take: 6,
          order: { createdAt: 'DESC' },
        }),
      ]);
      const recentBodies = [...posts, ...replies]
        .map((p) => (p.body || '').trim().substring(0, 512))
        .filter((b) => b.length > 10)
        .slice(0, cfg.maxRecentItems);

      if (recentBodies.length === 0) {
        end();
        return { isSimilar: false, similarCount: 0 };
      }

      const allTexts = [text.trim().substring(0, 512), ...recentBodies];
      const vectors = await this.embeddingService.generateEmbeddings(allTexts);
      end();
      if (!vectors || vectors.length < 2)
        return { isSimilar: false, similarCount: 0 };

      const currentEmb = vectors[0];
      let similarCount = 0;
      for (let i = 1; i < vectors.length; i++) {
        const sim = this.embeddingService.cosineSimilarity(
          currentEmb,
          vectors[i],
        );
        if (sim >= cfg.similarityThreshold) similarCount++;
        if (similarCount >= cfg.minSimilarCount) break;
      }
      return {
        isSimilar: similarCount >= cfg.minSimilarCount,
        similarCount,
      };
    } catch (e) {
      end();
      this.logger.warn(
        'Embedding similarity check failed',
        (e as Error).message,
      );
      return { isSimilar: false, similarCount: 0 };
    }
  }

  private async stage1RepetitionAndSimilarity(
    text: string,
    userId: string,
  ): Promise<ModerationResult> {
    const repeated = await this.checkRepeatedContent(text, userId);
    if (repeated.isRepeated) {
      moderationStageCounter.inc({ stage: 'exact_dup_block' });
      return {
        safe: false,
        reason: `Repeated content (${repeated.count} times).`,
        confidence: 0.95,
        needsStage2: false,
        reasonCode: ModerationReasonCode.REPEATED,
      };
    }

    const simhashDup = await this.checkSimHashNearDuplicate(userId, text);
    if (simhashDup) {
      return {
        safe: false,
        reason: 'Near-duplicate content (SimHash).',
        confidence: 0.93,
        needsStage2: false,
        reasonCode: ModerationReasonCode.REPEATED,
      };
    }

    const similar = await this.checkSimilarContentWithEmbeddings(userId, text);
    if (similar.isSimilar) {
      moderationStageCounter.inc({ stage: 'embedding_similar_block' });
      return {
        safe: false,
        reason: `Very similar to ${similar.similarCount} recent post(s)/reply(ies).`,
        confidence: 0.92,
        needsStage2: false,
        reasonCode: ModerationReasonCode.REPEATED,
      };
    }

    return { safe: true, confidence: 0.8, needsStage2: true };
  }

  private async stage2AIAnalysis(text: string): Promise<ModerationResult> {
    if (!this.hasTextModel) return this.fallbackContentAnalysis(text);

    const cfg = getConfig();
    const end = moderationDuration.startTimer({ stage: 'ollama' });
    try {
      const model = 'qwen2.5:0.5b';
      const userContent = `You are a content moderator. Most content should be allowed (safe: true).
ALLOW: controversial opinions, debate, strong views, criticism, satire. ONLY flag (safe: false) clear violations: spam, excessive advertising, harassment/threats, hate speech, incitement to violence, doxxing. When in doubt, safe: true.
Analyze this text and respond with the required JSON schema only. Text to analyze: ${JSON.stringify(text.substring(0, 300))}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Ollama chat timeout')),
          cfg.ollamaChatTimeoutMs,
        ),
      );
      const response = await Promise.race([
        this.ollama.chat({
          model,
          messages: [{ role: 'user', content: userContent }],
          format: schemaToFormat(ModerationTextSchema),
          options: { temperature: 0.1 },
        }),
        timeoutPromise,
      ]);

      const raw = response.message?.content ?? '';
      const parsed = JSON.parse(raw) as unknown;
      const result = ModerationTextSchema.parse(parsed);
      const reasonCode = this.parseReasonCode(result.reasonCode);
      end();
      if (!result.safe) moderationStageCounter.inc({ stage: 'ollama_block' });
      else moderationStageCounter.inc({ stage: 'ollama_allow' });
      return {
        safe: result.safe,
        reason: result.reason || 'AI check',
        confidence:
          typeof result.confidence === 'number' ? result.confidence : 0.8,
        reasonCode: result.safe === false ? reasonCode : undefined,
      };
    } catch (e) {
      end();
      this.logger.warn('Ollama text moderation failed', (e as Error).message);
      moderationStageCounter.inc({ stage: 'ollama_fallback' });
      return this.fallbackContentAnalysis(text);
    }
  }

  private parseReasonCode(value: unknown): ModerationReasonCode {
    if (typeof value !== 'string') return ModerationReasonCode.OTHER;
    const u = value.toUpperCase();
    if (Object.values(ModerationReasonCode).includes(u as ModerationReasonCode))
      return u as ModerationReasonCode;
    return ModerationReasonCode.OTHER;
  }

  private async stage2ImageAnalysis(
    buffer: Buffer,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    const visionModel = this.hasImageModel ? 'qwen2-vl' : null;
    if (!visionModel) return this.fallbackImageAnalysis(buffer);

    const cfg = getConfig();
    const end = moderationDuration.startTimer({ stage: 'ollama_image' });
    try {
      const base64 = buffer.toString('base64');
      const userContent =
        'Analyze this image for safety: nudity, gore, violence, hate symbols. Respond with the required JSON schema only.';
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Ollama image moderation timeout')),
          cfg.ollamaImageTimeoutMs,
        ),
      );
      const response = await Promise.race([
        this.ollama.chat({
          model: visionModel,
          messages: [{ role: 'user', content: userContent, images: [base64] }],
          format: schemaToFormat(ModerationImageSchema),
          options: { temperature: 0.1 },
        }),
        timeoutPromise,
      ]);
      const raw = response.message?.content ?? '';
      const parsed = JSON.parse(raw) as unknown;
      const result = ModerationImageSchema.parse(parsed);
      end();
      return {
        safe: result.safe,
        reason: result.reason || 'AI Flagged',
        confidence:
          typeof result.confidence === 'number' ? result.confidence : 0.8,
      };
    } catch (e) {
      end();
      this.logger.warn('Ollama image moderation failed', (e as Error).message);
      return this.fallbackImageAnalysis(buffer);
    }
  }

  private fallbackContentAnalysis(text: string): ModerationResult {
    const lower = text.toLowerCase();
    if (['kill', 'murder', 'suicide'].some((w) => lower.includes(w))) {
      return {
        safe: false,
        reason: 'Keyword flag',
        confidence: 0.6,
        reasonCode: ModerationReasonCode.VIOLENCE,
      };
    }
    if (lower.includes('hate')) {
      return {
        safe: false,
        reason: 'Keyword flag',
        confidence: 0.6,
        reasonCode: ModerationReasonCode.HATE,
      };
    }
    return { safe: true, confidence: 0.5 };
  }

  private fallbackImageAnalysis(buffer: Buffer) {
    if (buffer.length < 100)
      return { safe: false, reason: 'Corrupt', confidence: 1 };
    return { safe: true, confidence: 0.5 };
  }

  async checkContent(
    text: string,
    userId: string,
    _contentType: 'post' | 'reply' = 'post', // reserved for future per-type rules
    options: { onlyFast?: boolean } = {},
  ): Promise<ModerationResult> {
    void _contentType;
    try {
      const s1 = await this.stage1RepetitionAndSimilarity(text, userId);
      if (!s1.safe) return s1;
      if (!s1.needsStage2 || options.onlyFast) return s1;

      const s2 = await this.stage2AIAnalysis(text);
      if (!s2.safe)
        return {
          safe: false,
          reason: s2.reason,
          confidence: s2.confidence,
          reasonCode: s2.reasonCode ?? ModerationReasonCode.OTHER,
        };
      return {
        safe: true,
        confidence: (s1.confidence + s2.confidence) / 2,
      };
    } catch (e) {
      this.logger.error('checkContent threw', (e as Error).message);
      moderationStageCounter.inc({ stage: 'error_fail_open' });
      return { safe: true, confidence: 0.5 };
    }
  }

  async checkImage(buffer: Buffer) {
    try {
      return await this.stage2ImageAnalysis(buffer);
    } catch (e) {
      this.logger.error('checkImage threw', (e as Error).message);
      return this.fallbackImageAnalysis(buffer);
    }
  }
}
