import { Injectable, OnModuleInit } from '@nestjs/common';

const OLLAMA_EMBED_MODEL_DEFAULT = 'qwen3-embedding:0.6b';
const EMBED_TIMEOUT_MS =
  parseInt(process.env.OLLAMA_EMBED_TIMEOUT_MS || '15000', 10) || 15000;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private ollamaHost: string | null = null;
  private ollamaEmbedModel: string = OLLAMA_EMBED_MODEL_DEFAULT;

  onModuleInit() {
    this.ollamaHost = process.env.OLLAMA_HOST ?? null;
    this.ollamaEmbedModel =
      process.env.OLLAMA_EMBED_MODEL || OLLAMA_EMBED_MODEL_DEFAULT;
    if (this.ollamaHost) {
      console.log(
        `✅ Embedding: Ollama (${this.ollamaEmbedModel}) at ${this.ollamaHost} (timeout ${EMBED_TIMEOUT_MS}ms)`,
      );
    }
  }

  private cleanTextForEmbedding(text: string): string {
    return text
      .replace(/\[\[.*?\]\]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/#+\s*/g, '')
      .trim()
      .substring(0, 512);
  }

  /**
   * Generate one embedding via Ollama. Returns null if OLLAMA_HOST not set or request fails.
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    const cleanText = this.cleanTextForEmbedding(text);
    if (!cleanText) return null;
    if (!this.ollamaHost) return null;
    const batch = await this.embedViaOllamaBatch([cleanText]);
    return batch?.[0] ?? null;
  }

  /**
   * Generate embeddings for multiple texts in one Ollama API call (much faster than N single calls).
   */
  async generateEmbeddings(texts: string[]): Promise<number[][] | null> {
    if (!this.ollamaHost || texts.length === 0) return null;
    const cleaned = texts
      .map((t) => this.cleanTextForEmbedding(t))
      .filter((t) => t.length > 0);
    if (cleaned.length === 0) return null;
    return this.embedViaOllamaBatch(cleaned);
  }

  private async embedViaOllamaBatch(
    texts: string[],
  ): Promise<number[][] | null> {
    try {
      const res = await fetch(`${this.ollamaHost}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaEmbedModel,
          input: texts.length === 1 ? texts[0] : texts,
        }),
        signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { embeddings?: number[][] };
      const vecs = data.embeddings;
      return Array.isArray(vecs) && vecs.every(Array.isArray) ? vecs : null;
    } catch {
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
