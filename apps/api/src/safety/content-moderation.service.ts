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
import { CircuitBreaker } from '../common/circuit-breaker';

export type ModerationResult = {
  safe: boolean;
  reason?: string;
  confidence: number;
  needsStage2?: boolean;
  reasonCode?: ModerationReasonCode;
};

/** Text moderation response from granite4 (content moderation assistant). */
const GraniteTextSchema = z.object({
  type: z.enum(['ban', 'okay']),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
});

const GRANITE_SYSTEM_PROMPT = `You are a content moderation assistant for a social network.

Your task is to evaluate the given content and decide whether it should be **published** or **blocked**.

You must take a **relatively permissive approach**:

* Default to allowing content.
* Only return \`"ban"\` when the content **clearly and strongly violates policy**.
* If the violation is ambiguous, mild, contextual, or borderline, prefer \`"okay"\`.

You must respond **ONLY** with a valid JSON object.
**Do not include any explanations, comments, or extra text outside the JSON. This is strictly enforced.**

### Response format

{
  "type": "ban" | "okay",
  "confidence": 0.0,
  "reasons": []
}

### Field definitions

* **type**
  * \`"ban\`" → the content must NOT be published (use only for clear, severe violations)
  * \`"okay\`" → the content is allowed to be published

* **confidence**
  * A number between \`0.0\` and \`1.0\`
  * \`1.0\` = high confidence in the decision
  * \`0.0\` = low confidence in the decision

* **reasons**
  * An **array** of one or more applicable categories
  * Allowed values: harassment, hate_speech, violence, sexual_content, self_harm, illegal_activity, misinformation, spam, copyright_violation, privacy_violation, other, none
  * Use \`"none\`" **only** when \`type\` is \`"okay\`" and no policy violations are detected.

### Output rules (strict)
* Return **ONLY** the JSON object. No markdown. No prose. No explanations. No additional fields.`;

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
    ollamaTextModel: process.env.OLLAMA_TEXT_MODEL || 'granite4:latest',
    /** Only treat LLM "ban" as unsafe when confidence >= this (0–1). Reduces false positives. Default 0.65. */
    minConfidenceToBan:
      parseFloat(process.env.MODERATION_MIN_CONFIDENCE_TO_BAN || '0.65') ??
      0.65,
    /** Falconsai/nsfw_image_detection service URL. When set, used for image moderation. No Ollama vision. */
    moderationImageServiceUrl: process.env.MODERATION_IMAGE_SERVICE_URL || '',
    /** Timeout for NSFW detector HTTP call (under load it can be slow). Default 45s. */
    moderationImageTimeoutMs:
      parseInt(process.env.MODERATION_IMAGE_TIMEOUT_MS || '45000', 10) || 45000,
    /** If true, when NSFW detector is unavailable after retries allow upload (e.g. for agent runs). Default false. */
    moderationImageAllowOnUnavailable:
      process.env.MODERATION_IMAGE_ALLOW_ON_UNAVAILABLE === 'true',
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

  /** Circuit breaker for Ollama LLM calls. Opens after 5 failures, cooldown 30s. */
  private readonly ollamaBreaker = new CircuitBreaker({
    name: 'Ollama',
    failureThreshold: 5,
    cooldownMs: 30000,
  });

  /** Circuit breaker for NSFW image detection service. Opens after 3 failures, cooldown 60s. */
  private readonly nsfwBreaker = new CircuitBreaker({
    name: 'NSFWDetector',
    failureThreshold: 3,
    cooldownMs: 60000,
  });

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
    const cfg = getConfig();
    if (cfg.moderationImageServiceUrl) {
      this.hasImageModel = true;
      this.logger.log(
        `Image moderation: NSFW detector at ${cfg.moderationImageServiceUrl}`,
      );
    }
    try {
      const list = await this.ollama.list();
      const names = (list.models ?? []).map((m) => m.name ?? '');
      const textBase = cfg.ollamaTextModel.split(':')[0];
      this.hasTextModel = names.some(
        (n: string) =>
          n === cfg.ollamaTextModel ||
          n.startsWith(`${textBase}:`) ||
          n === textBase ||
          n.includes('granite') ||
          n.includes('qwen2.5') ||
          n.includes('gemma') ||
          n.includes('llama'),
      );
      this.logger.log(
        `Ollama: text=${this.hasTextModel} (model=${cfg.ollamaTextModel}), image=${this.hasImageModel}${cfg.moderationImageServiceUrl ? ' (NSFW detector)' : ' (none)'}`,
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
    const cfg = getConfig();
    if (!this.hasTextModel) {
      this.logger.warn(
        'Text moderation skipped: model not available; allowing content.',
      );
      return {
        safe: true,
        reason: 'Text moderation not configured; allowed.',
        confidence: 0,
        reasonCode: undefined,
      };
    }

    const end = moderationDuration.startTimer({ stage: 'ollama' });
    try {
      // Use circuit breaker to prevent hammering a failing Ollama instance
      return await this.ollamaBreaker.execute(async () => {
        const contentToEvaluate = text.substring(0, 4000).trim();
        const userContent = `Content to evaluate:\n\n${contentToEvaluate}`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Ollama chat timeout')),
            cfg.ollamaChatTimeoutMs,
          ),
        );
        const response = await Promise.race([
          this.ollama.chat({
            model: cfg.ollamaTextModel,
            messages: [
              { role: 'system', content: GRANITE_SYSTEM_PROMPT },
              { role: 'user', content: userContent },
            ],
            format: schemaToFormat(GraniteTextSchema),
            options: { temperature: 0.1 },
          }),
          timeoutPromise,
        ]);

        const raw = (response.message?.content ?? '').trim();
        const jsonRaw = raw
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/i, '');
        const parsed = JSON.parse(jsonRaw) as unknown;
        const result = GraniteTextSchema.parse(parsed);
        const confidence =
          typeof result.confidence === 'number' ? result.confidence : 0.8;
        // Only treat as unsafe when model says "ban" AND confidence is high enough (reduces false positives)
        const banRequested = result.type === 'ban';
        const safe = !banRequested || confidence < cfg.minConfidenceToBan;
        const reasonCode = safe
          ? undefined
          : this.parseReasonFromGranite(
              result.reasons?.[0] ?? result.reasons?.[1] ?? 'other',
            );
        end();
        if (!safe) moderationStageCounter.inc({ stage: 'ollama_block' });
        else moderationStageCounter.inc({ stage: 'ollama_allow' });
        return {
          safe,
          reason: safe
            ? undefined
            : result.reasons?.join(', ') || 'Policy violation',
          confidence,
          reasonCode,
        } satisfies ModerationResult;
      });
    } catch (e) {
      end();
      const isCircuitOpen = (e as Error).name === 'CircuitOpenError';
      this.logger.warn(
        `Ollama text moderation failed${isCircuitOpen ? ' (circuit open)' : ''}`,
        (e as Error).message,
      );
      moderationStageCounter.inc({
        stage: isCircuitOpen ? 'ollama_circuit_open' : 'ollama_fail',
      });
      // Fail open with degraded confidence: flag for async re-moderation
      return {
        safe: true,
        reason: 'Text moderation unavailable; allowed pending review.',
        confidence: 0,
        reasonCode: undefined,
      };
    }
  }

  /** Map granite reasons (snake_case) to ModerationReasonCode. */
  private parseReasonFromGranite(reason: string): ModerationReasonCode {
    const r = (reason || 'other').toLowerCase().trim();
    const map: Record<string, ModerationReasonCode> = {
      harassment: ModerationReasonCode.HARASSMENT,
      hate_speech: ModerationReasonCode.HATE,
      violence: ModerationReasonCode.VIOLENCE,
      sexual_content: ModerationReasonCode.OTHER,
      self_harm: ModerationReasonCode.VIOLENCE,
      illegal_activity: ModerationReasonCode.OTHER,
      misinformation: ModerationReasonCode.OTHER,
      spam: ModerationReasonCode.SPAM,
      copyright_violation: ModerationReasonCode.OTHER,
      privacy_violation: ModerationReasonCode.OTHER,
      other: ModerationReasonCode.OTHER,
      none: ModerationReasonCode.OTHER,
    };
    return map[r] ?? ModerationReasonCode.OTHER;
  }

  private parseReasonCode(value: unknown): ModerationReasonCode {
    if (typeof value !== 'string') return ModerationReasonCode.OTHER;
    const u = value.toUpperCase();
    if (Object.values(ModerationReasonCode).includes(u as ModerationReasonCode))
      return u as ModerationReasonCode;
    return ModerationReasonCode.OTHER;
  }

  /** Call Falconsai/nsfw_image_detection service (ViT). Returns { safe, confidence }. */
  private async callNsfwDetector(
    buffer: Buffer,
    cfg: ReturnType<typeof getConfig>,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    const url = `${cfg.moderationImageServiceUrl.replace(/\/$/, '')}/classify`;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      cfg.moderationImageTimeoutMs,
    );
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: new Uint8Array(buffer),
        headers: { 'Content-Type': 'application/octet-stream' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new Error(`NSFW detector: ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as {
        safe?: boolean;
        confidence?: number;
        reason?: string;
      };
      return {
        safe: json.safe === true,
        reason: json.reason ?? (json.safe ? 'normal' : 'NSFW'),
        confidence: typeof json.confidence === 'number' ? json.confidence : 0.8,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async stage2ImageAnalysis(
    buffer: Buffer,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    const cfg = getConfig();

    // NSFW detector (Falconsai/nsfw_image_detection) when configured; no Ollama vision
    if (cfg.moderationImageServiceUrl) {
      const end = moderationDuration.startTimer({
        stage: 'nsfw_detector_image',
      });
      try {
        // Use circuit breaker to prevent hammering a failing NSFW detector
        return await this.nsfwBreaker.execute(async () => {
          const result = await this.callNsfwDetector(buffer, cfg);
          return result;
        });
      } catch (e) {
        end();
        const isCircuitOpen = (e as Error).name === 'CircuitOpenError';
        this.logger.warn(
          `NSFW detector failed${isCircuitOpen ? ' (circuit open)' : ''}`,
          (e as Error).message,
        );
        moderationStageCounter.inc({
          stage: isCircuitOpen ? 'nsfw_circuit_open' : 'nsfw_fail',
        });

        if (cfg.moderationImageAllowOnUnavailable) {
          this.logger.warn(
            'Image moderation unavailable; allowing upload (MODERATION_IMAGE_ALLOW_ON_UNAVAILABLE=true)',
          );
          return {
            safe: true,
            reason: 'moderation_unavailable_allowed',
            confidence: 0,
          };
        }
        return {
          safe: false,
          reason: 'Image moderation unavailable. Please try again.',
          confidence: 0,
        };
      } finally {
        end();
      }
    }

    // No image moderation configured: reject (strictly use MODERATION_IMAGE_SERVICE_URL)
    this.logger.warn(
      'Image moderation skipped: MODERATION_IMAGE_SERVICE_URL not set.',
    );
    return {
      safe: false,
      reason:
        'Image moderation not configured. Set MODERATION_IMAGE_SERVICE_URL.',
      confidence: 0,
    };
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
      // Fail open: do not soft-delete on moderation errors (e.g. Redis/DB/embedding blip)
      return {
        safe: true,
        reason: 'Content moderation error; allowed.',
        confidence: 0,
        reasonCode: undefined,
      };
    }
  }

  async checkImage(buffer: Buffer) {
    try {
      return await this.stage2ImageAnalysis(buffer);
    } catch (e) {
      this.logger.error('checkImage threw', (e as Error).message);
      // Reject on error (never use mock safe)
      return {
        safe: false,
        reason: 'Image moderation error.',
        confidence: 0,
      };
    }
  }
}
