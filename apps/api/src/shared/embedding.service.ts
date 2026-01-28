import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private embeddingModel: any = null;
  private isModelLoaded = false;

  onModuleInit() {
    // Load embedding model asynchronously (don't block startup)
    void this.loadEmbeddingModel().catch((err: Error) => {
      console.warn(
        'Failed to load embedding model, semantic search will fallback:',
        err.message,
      );
    });
  }

  /**
   * Load embedding model (Xenova Transformers - runs locally)
   */
  private async loadEmbeddingModel() {
    try {
      // Lazy import to avoid startup crashes if native deps are missing
      const { pipeline } = await import('@xenova/transformers');
      // Use a lightweight sentence transformer model
      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2', // Fast, lightweight model
      );
      this.isModelLoaded = true;
      console.log('✅ Embedding model loaded for semantic search');
    } catch (error) {
      console.warn('Could not load embedding model:', error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.isModelLoaded || !this.embeddingModel) {
      return null;
    }

    try {
      // Clean text (remove markdown, wikilinks)
      const cleanText = text
        .replace(/\[\[.*?\]\]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/#+\s*/g, '')
        .trim()
        .substring(0, 512); // Limit length

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const output = await this.embeddingModel(cleanText, {
        pooling: 'mean',
        normalize: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
