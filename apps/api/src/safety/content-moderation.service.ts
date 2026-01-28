import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BayesClassifier } from 'natural';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';

/**
 * Two-stage content moderation service
 *
 * Stage 1: Bayesian Filter - Detects repeated spam (same content posted multiple times)
 * Stage 2: Gemma 3 270M - Analyzes content for violence, harassment, etc.
 */
@Injectable()
export class ContentModerationService implements OnModuleInit {
  private bayesianClassifier: BayesClassifier;
  private isGemmaAvailable = false;

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
  ) {
    this.bayesianClassifier = new BayesClassifier();
  }

    async onModuleInit() {
      // Train Bayesian classifier with initial spam corpus
      this.trainBayesianClassifier();
      
      // Check if Gemma is available (Ollama or local)    await this.checkGemmaAvailability();
  }

  /**
   * Train Bayesian classifier with spam/non-spam examples
   */
  private trainBayesianClassifier() {
    // Spam examples (repeated content patterns)
    const spamExamples = [
      'buy now click here',
      'free money guaranteed',
      'click this link now',
      'limited time offer',
      'act now before its too late',
      'you have won a prize',
      'congratulations you are selected',
    ];

    // Non-spam examples (normal content)
    const nonSpamExamples = [
      'this is a great article about technology',
      'i enjoyed reading your post',
      'thanks for sharing your thoughts',
      'what do you think about this topic',
      'i agree with your perspective',
      'this is interesting information',
      'can you explain more about this',
    ];

    // Train classifier
    for (const spam of spamExamples) {
      this.bayesianClassifier.addDocument(spam, 'spam');
    }
    for (const nonSpam of nonSpamExamples) {
      this.bayesianClassifier.addDocument(nonSpam, 'non-spam');
    }

    this.bayesianClassifier.train();
  }

  /**
   * Check if Gemma 3 270M is available via Ollama
   */
  private async checkGemmaAvailability() {
    try {
      // Try to connect to Ollama (check environment variable for host)
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const response = await fetch(`${ollamaHost}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        // Check if gemma3:270m, gemma2:2b, or any gemma model is available
        const hasGemma = data.models?.some(
          (m: any) =>
            m.name?.includes('gemma3') ||
            m.name?.includes('gemma2') ||
            m.name?.includes('gemma'),
        );
        this.isGemmaAvailable = hasGemma || false;

        if (this.isGemmaAvailable) {
          console.log('✅ Gemma model available for content moderation');
        } else {
          console.log('⚠️ Gemma model not found, using fallback moderation');
        }
      }
    } catch (error) {
      // Ollama not available - use fallback
      this.isGemmaAvailable = false;
      console.warn(
        '⚠️ Ollama not available, using fallback moderation:',
        error.message,
      );
    }
  }

  /**
   * Check for repeated content (same text posted multiple times)
   * This is what the Bayesian filter should catch
   */
  private async checkRepeatedContent(
    text: string,
    userId: string,
    contentType: 'post' | 'reply',
  ): Promise<{ isRepeated: boolean; count: number }> {
    // Normalize text for comparison (lowercase, remove extra spaces)
    const normalizedText = text.toLowerCase().trim().replace(/\s+/g, ' ');

    // Check posts
    const posts = await this.postRepo.find({
      where: { authorId: userId },
      select: ['body'],
      take: 50, // Check last 50 posts
    });

    // Check replies
    const replies = await this.replyRepo.find({
      where: { authorId: userId },
      select: ['body'],
      take: 50, // Check last 50 replies
    });

    // Count occurrences of similar content
    let count = 0;
    const similarityThreshold = 0.9; // 90% similarity

    for (const post of posts) {
      const normalizedPost = post.body
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
      const similarity = this.calculateSimilarity(
        normalizedText,
        normalizedPost,
      );
      if (similarity >= similarityThreshold) {
        count++;
      }
    }

    for (const reply of replies) {
      const normalizedReply = reply.body
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
      const similarity = this.calculateSimilarity(
        normalizedText,
        normalizedReply,
      );
      if (similarity >= similarityThreshold) {
        count++;
      }
    }

    return {
      isRepeated: count >= 2, // Flag if same content appears 2+ times
      count,
    };
  }

  /**
   * Calculate similarity between two strings (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;

    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Stage 1: Fast Bayesian Filter
   * Detects obvious spam and repeated content
   */
  private async stage1BayesianFilter(
    text: string,
    userId: string,
    contentType: 'post' | 'reply',
  ): Promise<{
    safe: boolean;
    reason?: string;
    confidence: number;
    needsStage2: boolean;
  }> {
    // Check for repeated content first
    const repeated = await this.checkRepeatedContent(text, userId, contentType);
    if (repeated.isRepeated) {
      return {
        safe: false,
        reason: `Repeated content detected. This content has been posted ${repeated.count} times.`,
        confidence: 0.95,
        needsStage2: false,
      };
    }

    // Use Bayesian classifier
    const classifications = this.bayesianClassifier.getClassifications(text);
    const spamClassification = classifications.find((c) => c.label === 'spam');
    const nonSpamClassification = classifications.find(
      (c) => c.label === 'non-spam',
    );

    const spamScore = spamClassification?.value || 0;
    const nonSpamScore = nonSpamClassification?.value || 0;
    const totalScore = spamScore + nonSpamScore;

    if (totalScore === 0) {
      // No classification - needs Stage 2
      return { safe: true, confidence: 0.5, needsStage2: true };
    }

    const spamConfidence = spamScore / totalScore;

    // High confidence spam (>0.9) - reject immediately
    if (spamConfidence > 0.9) {
      return {
        safe: false,
        reason: 'Content flagged as spam by automated filter.',
        confidence: spamConfidence,
        needsStage2: false,
      };
    }

    // High confidence non-spam (>0.9) - approve immediately
    if (spamConfidence < 0.1) {
      return {
        safe: true,
        confidence: 1 - spamConfidence,
        needsStage2: false,
      };
    }

    // Ambiguous case - needs Stage 2
    return {
      safe: true,
      confidence: 1 - spamConfidence,
      needsStage2: true,
    };
  }

  /**
   * Stage 2: Gemma 3 270M Content Safety Analysis
   * Analyzes content for violence, harassment, hate speech, etc.
   */
  private async stage2GemmaAnalysis(
    text: string,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    if (!this.isGemmaAvailable) {
      // Fallback: Use keyword-based detection if Gemma not available
      return this.fallbackContentAnalysis(text);
    }

    try {
      // Call Ollama API for Gemma 3 270M
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:270m', // Try gemma3:270m first, fallback handled by Ollama
          prompt: `Analyze this content for safety. Check for: violence, harassment, hate speech, threats, or harmful content. Respond with JSON: {"safe": true/false, "reason": "explanation", "confidence": 0.0-1.0}\n\nContent: "${text.substring(0, 500)}"`,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent analysis
          },
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.response || '';

        // Try to parse JSON from response
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return {
              safe: analysis.safe !== false,
              reason: analysis.reason,
              confidence: analysis.confidence || 0.7,
            };
          }
        } catch (e) {
          // JSON parsing failed, use text analysis
        }

        // Fallback: Check if response indicates unsafe content
        const unsafeIndicators = [
          'unsafe',
          'violence',
          'harassment',
          'hate',
          'threat',
        ];
        const isUnsafe = unsafeIndicators.some((indicator) =>
          responseText.toLowerCase().includes(indicator),
        );

        return {
          safe: !isUnsafe,
          reason: isUnsafe
            ? 'Content flagged by AI safety analysis.'
            : undefined,
          confidence: 0.7,
        };
      }
    } catch (error) {
      // Ollama not responding - use fallback
    }

    return this.fallbackContentAnalysis(text);
  }

  /**
   * Fallback content analysis (keyword-based)
   * Used when Gemma is not available
   */
  private fallbackContentAnalysis(text: string): {
    safe: boolean;
    reason?: string;
    confidence: number;
  } {
    const lower = text.toLowerCase();

    // Violence indicators
    const violenceKeywords = [
      'kill',
      'murder',
      'violence',
      'attack',
      'harm',
      'hurt',
    ];
    // Harassment indicators
    const harassmentKeywords = ['harass', 'bully', 'threaten', 'intimidate'];
    // Hate speech indicators
    const hateKeywords = ['hate', 'racist', 'discriminate', 'slur'];

    const hasViolence = violenceKeywords.some((kw) => lower.includes(kw));
    const hasHarassment = harassmentKeywords.some((kw) => lower.includes(kw));
    const hasHate = hateKeywords.some((kw) => lower.includes(kw));

    if (hasViolence || hasHarassment || hasHate) {
      const reasons = [];
      if (hasViolence) reasons.push('violence');
      if (hasHarassment) reasons.push('harassment');
      if (hasHate) reasons.push('hate speech');

      return {
        safe: false,
        reason: `Content contains ${reasons.join(', ')}.`,
        confidence: 0.7,
      };
    }

    return { safe: true, confidence: 0.6 };
  }

  /**
   * Main content moderation check
   * Two-stage pipeline: Bayesian → Gemma
   */
  async checkContent(
    text: string,
    userId: string,
    contentType: 'post' | 'reply' = 'post',
    options: { onlyFast?: boolean } = {}, // Added option
  ): Promise<{
    safe: boolean;
    reason?: string;
    confidence?: number;
    needsStage2?: boolean;
  }> {
    // Stage 1: Fast Bayesian Filter
    const stage1Result = await this.stage1BayesianFilter(
      text,
      userId,
      contentType,
    );

    // If Stage 1 has high confidence, return immediately
    if (!stage1Result.needsStage2) {
      return {
        safe: stage1Result.safe,
        reason: stage1Result.reason,
        confidence: stage1Result.confidence,
        needsStage2: false,
      };
    }

    // If only fast check is requested, return ambiguous result
    if (options.onlyFast) {
      return {
        safe: true, // Assume safe for now
        confidence: stage1Result.confidence,
        needsStage2: true, // Signal that it needs async check
      };
    }

    // Stage 2: Gemma 3 270M for ambiguous cases
    const stage2Result = await this.stage2GemmaAnalysis(text);

    // Combine results (Stage 2 takes precedence for content safety)
    if (!stage2Result.safe) {
      return {
        safe: false,
        reason: stage2Result.reason || 'Content flagged by AI safety analysis.',
        confidence: stage2Result.confidence,
        needsStage2: false,
      };
    }

    // Both stages passed
    return {
      safe: true,
      confidence: (stage1Result.confidence + stage2Result.confidence) / 2,
      needsStage2: false,
    };
  }

  /**
   * Check image for appropriateness (profile pictures, header images)
   * Uses Gemma 3 270M for AI-powered image analysis
   */
  async checkImage(
    buffer: Buffer,
  ): Promise<{ safe: boolean; reason?: string; confidence?: number }> {
    // Validate file size
    if (buffer.length < 100) {
      return {
        safe: false,
        reason: 'Image file corrupted or invalid.',
        confidence: 1.0,
      };
    }

    // Use Gemma 3 270M for image analysis (via Ollama vision capabilities)
    if (this.isGemmaAvailable) {
      return this.stage2GemmaImageAnalysis(buffer);
    }

    // Fallback: Basic validation only
    return this.fallbackImageAnalysis(buffer);
  }

  /**
   * Stage 2: Gemma 3 270M Image Analysis
   * Analyzes images for inappropriate content (nudity, violence, etc.)
   */
  private async stage2GemmaImageAnalysis(
    buffer: Buffer,
  ): Promise<{ safe: boolean; reason?: string; confidence: number }> {
    try {
      // Convert image to base64
      const base64Image = buffer.toString('base64');

      // Determine image format
      let mimeType = 'image/jpeg';
      if (buffer[0] === 0xff && buffer[1] === 0xd8) mimeType = 'image/jpeg';
      if (buffer[0] === 0x89 && buffer[1] === 0x50) mimeType = 'image/png';
      if (buffer[0] === 0x52 && buffer[1] === 0x49) mimeType = 'image/webp';

      // Call Ollama API for Gemma 3 270M image analysis
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const response = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:270m', // Try gemma3:270m first
          prompt: `Analyze this image for appropriateness. Check for: nudity, violence, explicit content, inappropriate material. Respond with JSON only: {"safe": true/false, "reason": "explanation", "confidence": 0.0-1.0}`,
          images: [base64Image],
          stream: false,
          options: {
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.response || '';

        // Try to parse JSON from response
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return {
              safe: analysis.safe !== false,
              reason: analysis.reason,
              confidence: analysis.confidence || 0.7,
            };
          }
        } catch (e) {
          // JSON parsing failed
        }

        // Fallback: Check if response indicates unsafe content
        const unsafeIndicators = [
          'unsafe',
          'inappropriate',
          'nudity',
          'violence',
          'explicit',
        ];
        const isUnsafe = unsafeIndicators.some((indicator) =>
          responseText.toLowerCase().includes(indicator),
        );

        return {
          safe: !isUnsafe,
          reason: isUnsafe ? 'Image flagged by AI safety analysis.' : undefined,
          confidence: 0.7,
        };
      }
    } catch (error) {
      // Ollama not responding or model not available - use fallback
      console.warn(
        'Gemma image analysis failed, using fallback:',
        error.message,
      );
    }

    // Fallback: Basic checks
    return this.fallbackImageAnalysis(buffer);
  }

  /**
   * Fallback image analysis (when Gemma not available)
   */
  private fallbackImageAnalysis(buffer: Buffer): {
    safe: boolean;
    reason?: string;
    confidence: number;
  } {
    // Basic validation: file size, format
    if (buffer.length < 100) {
      return {
        safe: false,
        reason: 'Image file too small or corrupted.',
        confidence: 1.0,
      };
    }

    // Check for valid image headers
    const isValidImage =
      (buffer[0] === 0xff && buffer[1] === 0xd8) || // JPEG
      (buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47) || // PNG
      (buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46); // WEBP/RIFF

    if (!isValidImage) {
      return { safe: false, reason: 'Invalid image format.', confidence: 1.0 };
    }

    // Basic check passed (full AI analysis requires Gemma)
    return { safe: true, confidence: 0.5 };
  }
}
