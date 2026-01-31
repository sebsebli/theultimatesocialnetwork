import { Injectable } from '@nestjs/common';

export interface OgMetadata {
  title?: string;
  description?: string;
  image?: string;
}

@Injectable()
export class MetadataService {
  private readonly MAX_BODY_LENGTH = 100_000;
  private readonly REQUEST_TIMEOUT_MS = 5000;

  async getOpenGraph(url: string): Promise<OgMetadata> {
    const normalized = this.normalizeUrl(url);
    if (!normalized) return {};

    try {
      const res = await fetch(normalized, {
        method: 'GET',
        headers: {
          'User-Agent': 'Citewalk-Bot/1.0 (Open Graph metadata)',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(this.REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) return {};

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.toLowerCase().includes('text/html')) return {};

      const text = await res.text();
      const slice = text.slice(0, this.MAX_BODY_LENGTH);

      const title =
        this.extractMeta(slice, 'og:title') ??
        this.extractMeta(slice, 'twitter:title');
      const description =
        this.extractMeta(slice, 'og:description') ??
        this.extractMeta(slice, 'twitter:description');
      const image =
        this.extractMeta(slice, 'og:image') ??
        this.extractMeta(slice, 'twitter:image');
      return {
        title: title ?? undefined,
        description: description ?? undefined,
        image: image ?? undefined,
      };
    } catch {
      return {};
    }
  }

  private normalizeUrl(input: string): string | null {
    const trimmed = input?.trim();
    if (!trimmed) return null;
    try {
      const u = new URL(
        trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      );
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u.href;
    } catch {
      return null;
    }
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(
        `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`,
        'i',
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return this.decodeHtml(m[1]);
    }
    return null;
  }

  private decodeHtml(s: string): string {
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}
