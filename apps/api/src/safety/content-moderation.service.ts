/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BayesClassifier } from 'natural';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';

/**
 * Two-stage content moderation service
 *
 * Stage 1: Bayesian Filter - Detects repeated spam
 * Stage 2: AI (Ollama) - Analyzes content for violence, harassment, etc.
 * - Text: qwen2.5:0.5b (Fast, multilingual)
 * - Image: moondream (Fast vision)
 */
@Injectable()
export class ContentModerationService implements OnModuleInit {
  private bayesianClassifier: BayesClassifier;
  private hasTextModel = false;
  private hasImageModel = false;

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
  ) {
    this.bayesianClassifier = new BayesClassifier();
  }

  async onModuleInit() {
    this.trainBayesianClassifier();
    await this.checkOllamaModels();
  }

  private trainBayesianClassifier() {
    const spam = [
      'buy now click here',
      'free money',
      'click link',
      'limited offer',
      'prize winner',
      'crypto giveaway',
    ];
    const nonSpam = [
      'great article',
      'thanks for sharing',
      'interesting point',
      'i agree',
      'what do you think',
      'hello world',
    ];
    spam.forEach((t) => this.bayesianClassifier.addDocument(t, 'spam'));
    nonSpam.forEach((t) => this.bayesianClassifier.addDocument(t, 'non-spam'));
    this.bayesianClassifier.train();
  }

  private async checkOllamaModels() {
    try {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const response = await fetch(`${ollamaHost}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map((m: any) => m.name);

        // Check for text model (qwen2.5 preferred, fallback to gemma/llama)
        this.hasTextModel = models.some(
          (n: string) =>
            n.includes('qwen2.5') || n.includes('gemma') || n.includes('llama'),
        );

        // Check for vision model (qwen2-vl preferred, fallback to others)
        this.hasImageModel = models.some(
          (n: string) =>
            n.includes('qwen2-vl') ||
            n.includes('moondream') ||
            n.includes('llava') ||
            n.includes('minicpm'),
        );

        console.log(
          `✅ AI Safety: Text=${this.hasTextModel}, Image=${this.hasImageModel}`,
        );
      }
    } catch (e) {
      console.warn('⚠️ Ollama not available:', e.message);
    }
  }

  // ... repeated content check logic remains same ...
  private async checkRepeatedContent(
    text: string,
    userId: string,
  ): Promise<{ isRepeated: boolean; count: number }> {
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');
    const posts = await this.postRepo.find({
      where: { authorId: userId },
      select: ['body'],
      take: 20,
    });
    const replies = await this.replyRepo.find({
      where: { authorId: userId },
      select: ['body'],
      take: 20,
    });

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
    return { isRepeated: count >= 2, count };
  }

  // Stage 1
  private async stage1BayesianFilter(
    text: string,
    userId: string,
  ): Promise<{
    safe: boolean;
    reason?: string;
    confidence: number;
    needsStage2: boolean;
  }> {
    const repeated = await this.checkRepeatedContent(text, userId);
    if (repeated.isRepeated) {
      return {
        safe: false,
        reason: `Repeated content (${repeated.count} times).`,
        confidence: 0.95,
        needsStage2: false,
      };
    }

    const classifications = this.bayesianClassifier.getClassifications(text);
    const spamScore =
      classifications.find((c: any) => c.label === 'spam')?.value || 0;
    const total = classifications.reduce((a: number, b: any) => a + b.value, 0);
    const spamProb = total > 0 ? spamScore / total : 0.5;

    if (spamProb > 0.9)
      return {
        safe: false,
        reason: 'Spam detected.',
        confidence: spamProb,
        needsStage2: false,
      };
    if (spamProb < 0.1)
      return { safe: true, confidence: 1 - spamProb, needsStage2: false };

    return { safe: true, confidence: 1 - spamProb, needsStage2: true };
  }

  // Stage 2 Text (Qwen)
  private async stage2AIAnalysis(
    text: string,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    if (!this.hasTextModel) return this.fallbackContentAnalysis(text);

    try {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const model = 'qwen2.5:0.5b';

      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: `Analyze the following text for safety. Check for: hate speech, violence, harassment, or spam.
Respond ONLY with a JSON object in this format: {"safe": boolean, "reason": "string", "confidence": number}.
Text: "${text.substring(0, 300)}"`,
          format: 'json', // Force structured output
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const result = JSON.parse(data.response);
          return {
            safe: result.safe !== false, // Default to true if missing
            reason: result.reason || 'AI check',
            confidence:
              typeof result.confidence === 'number' ? result.confidence : 0.8,
          };
        } catch (e) {
          console.warn('JSON parse failed for text moderation', e);
        }
      }
    } catch {
      // ignore
    }
    return this.fallbackContentAnalysis(text);
  }

  // Stage 2 Image (Qwen2-VL)
  private async stage2ImageAnalysis(
    buffer: Buffer,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    // Check if we have a vision-capable model (qwen2-vl, llama3.2-vision, etc)
    const visionModel = this.hasImageModel ? 'qwen2-vl' : null;

    if (!visionModel) return this.fallbackImageAnalysis(buffer);

    try {
      const base64 = buffer.toString('base64');
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: visionModel,
          prompt:
            'Analyze this image for safety. Check for nudity, gore, violence, or hate symbols. Respond with JSON: {"safe": boolean, "reason": "string", "confidence": number}',
          images: [base64],
          format: 'json', // Force structured output!
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(10000), // Vision takes longer
      });

      if (response.ok) {
        const data = await response.json();
        const result = JSON.parse(data.response);
        return {
          safe: result.safe !== false,
          reason: result.reason || 'AI Flagged',
          confidence:
            typeof result.confidence === 'number' ? result.confidence : 0.8,
        };
      }
    } catch (e) {
      console.warn('Vision check failed', e);
    }
    return this.fallbackImageAnalysis(buffer);
  }

  private fallbackContentAnalysis(text: string) {
    const bad = ['kill', 'hate', 'murder', 'suicide'];
    if (bad.some((w) => text.toLowerCase().includes(w))) {
      return { safe: false, reason: 'Keyword flag', confidence: 0.6 };
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for per-type moderation
    contentType: 'post' | 'reply' = 'post',
    options: { onlyFast?: boolean } = {},
  ) {
    const s1 = await this.stage1BayesianFilter(text, userId);
    if (!s1.needsStage2 || options.onlyFast) return s1;

    const s2 = await this.stage2AIAnalysis(text);
    if (!s2.safe) return s2;

    return { safe: true, confidence: (s1.confidence + s2.confidence) / 2 };
  }

  async checkImage(buffer: Buffer) {
    return this.stage2ImageAnalysis(buffer);
  }
}
