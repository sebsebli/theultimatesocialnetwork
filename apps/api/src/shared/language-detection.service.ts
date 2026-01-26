import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import Redis from 'ioredis';

/**
 * Language detection service
 * Uses franc library (Node.js equivalent of lingua-py)
 * 
 * Fallback strategy:
 * 1. Use franc for detection
 * 2. If confidence low, use user's profile languages
 * 3. If still unclear, use user's most common post language
 * 4. Default to English
 */
@Injectable()
export class LanguageDetectionService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  /**
   * Get user's most common language from their posts
   */
  private async getUserMostCommonLanguage(userId: string): Promise<string | null> {
    const cacheKey = `user:lang:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const posts = await this.postRepo.find({
      where: { authorId: userId },
      select: ['lang'],
      take: 100, // Check last 100 posts
    });

    if (posts.length === 0) {
      return null;
    }

    // Count language occurrences
    const langCounts: Record<string, number> = {};
    for (const post of posts) {
      if (post.lang) {
        langCounts[post.lang] = (langCounts[post.lang] || 0) + 1;
      }
    }

    // Find most common language
    let mostCommonLang: string | null = null;
    let maxCount = 0;
    for (const [lang, count] of Object.entries(langCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonLang = lang;
      }
    }

    if (mostCommonLang) {
      await this.redis.set(cacheKey, mostCommonLang, 'EX', 86400); // 24h cache
    }

    return mostCommonLang;
  }

  /**
   * Detect language from text
   * Returns ISO 639-1 language code and confidence (0-1)
   */
  async detectLanguage(
    text: string,
    userId?: string,
    userLanguages?: string[],
  ): Promise<{ lang: string; confidence: number }> {
    // Remove markdown syntax, wikilinks, URLs for better detection
    const cleanText = text
      .replace(/\[\[.*?\]\]/g, '') // Remove wikilinks
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/#+\s*/g, '') // Remove headers
      .replace(/\*\*.*?\*\*/g, '') // Remove bold
      .replace(/_.*?_/g, '') // Remove italic
      .trim();

    if (cleanText.length < 10) {
      // Very short text - use fallback
      if (userLanguages && userLanguages.length > 0) {
        return { lang: userLanguages[0], confidence: 0.4 };
      }
      return { lang: 'en', confidence: 0.3 };
    }

    // Use franc for language detection (Node.js equivalent of lingua-py)
    // Dynamic import to handle ESM in CJS environment (Jest)
    const { franc } = await import('franc');
    const detectedLang = franc(cleanText, { minLength: 3 });
    
    // Franc returns ISO 639-3 codes, convert to ISO 639-1 for common languages
    const langMap: Record<string, string> = {
      'eng': 'en', 'deu': 'de', 'fra': 'fr', 'spa': 'es', 'ita': 'it',
      'por': 'pt', 'nld': 'nl', 'fin': 'fi', 'swe': 'sv', 'nor': 'no',
      'dan': 'da', 'pol': 'pl', 'rus': 'ru', 'jpn': 'ja', 'kor': 'ko',
      'zho': 'zh', 'ara': 'ar', 'heb': 'he', 'tur': 'tr', 'ces': 'cs',
      'hun': 'hu', 'ron': 'ro', 'bul': 'bg', 'hrv': 'hr', 'srp': 'sr',
      'slk': 'sk', 'slv': 'sl', 'est': 'et', 'lav': 'lv', 'lit': 'lt',
      'gre': 'el', 'tha': 'th', 'vie': 'vi', 'ind': 'id', 'msa': 'ms',
    };

    const lang = langMap[detectedLang] || detectedLang || 'en';
    
    // Franc doesn't provide confidence, estimate based on text length
    // Longer text = higher confidence
    const baseConfidence = Math.min(0.95, Math.max(0.5, cleanText.length / 200));

    // If confidence is low, try fallbacks
    if (baseConfidence < 0.6) {
      // Fallback 1: Check if detected lang matches user's profile languages
      if (userLanguages && userLanguages.length > 0) {
        if (userLanguages.includes(lang)) {
          // Boost confidence if it matches user's language
          return { lang, confidence: Math.min(0.8, baseConfidence + 0.2) };
        }
        // Use first user language as fallback
        return { lang: userLanguages[0], confidence: 0.5 };
      }

      // Fallback 2: Use user's most common post language
      if (userId) {
        const commonLang = await this.getUserMostCommonLanguage(userId);
        if (commonLang) {
          return { lang: commonLang, confidence: 0.5 };
        }
      }
    }

    return { lang, confidence: baseConfidence };
  }
}
