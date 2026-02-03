/**
 * Fetch profile/header images from Pixabay or Pexels, return as Buffer for upload to Cite.
 * Use Pixabay for square-ish (avatar), Pexels for landscape (header) or either.
 */

export interface ImageProviderConfig {
  pixabayApiKey?: string;
  pexelsApiKey?: string;
}

export interface ImageResult {
  url: string;
  buffer: Buffer;
  source: 'pixabay' | 'pexels';
}

/** Fetch image URL to buffer. */
export async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch (e) {
    console.error('Fetch image failed', url, e);
    return null;
  }
}

/** Pixabay: GET https://pixabay.com/api/?key=KEY&q=QUERY&image_type=photo&per_page=5 */
export async function pixabaySearch(
  apiKey: string,
  query: string,
  options: { orientation?: 'horizontal' | 'vertical' | 'all'; perPage?: number } = {},
): Promise<{ url: string; largeUrl?: string }[] | null> {
  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    image_type: 'photo',
    safesearch: 'true',
    per_page: String(options.perPage ?? 5),
  });
  if (options.orientation && options.orientation !== 'all') {
    params.set('orientation', options.orientation);
  }
  const res = await fetch(`https://pixabay.com/api/?${params}`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    hits?: Array<{
      webformatURL?: string;
      largeImageURL?: string;
      previewURL?: string;
    }>;
  };
  const hits = data.hits ?? [];
  return hits.map((h) => ({
    url: h.largeImageURL ?? h.webformatURL ?? h.previewURL ?? '',
    largeUrl: h.largeImageURL ?? undefined,
  })).filter((x) => x.url);
}

/** Pexels: GET https://api.pexels.com/v1/search?query=QUERY, Authorization: API_KEY */
export async function pexelsSearch(
  apiKey: string,
  query: string,
  options: { orientation?: 'landscape' | 'portrait' | 'square'; perPage?: number } = {},
): Promise<{ url: string; smallUrl?: string }[] | null> {
  const params = new URLSearchParams({
    query,
    per_page: String(options.perPage ?? 5),
  });
  if (options.orientation) params.set('orientation', options.orientation);
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    photos?: Array<{
      src?: { medium?: string; large?: string; portrait?: string; landscape?: string; small?: string };
    }>;
  };
  const photos = data.photos ?? [];
  return photos.map((p) => {
    const src = p.src ?? {};
    const url = src.landscape ?? src.large ?? src.medium ?? src.small ?? '';
    return { url, smallUrl: src.small ?? url };
  }).filter((x) => x.url);
}

/** Get one image buffer for avatar (square-ish). Prefer Pexels portrait, else Pixabay. */
export async function getAvatarImage(
  config: ImageProviderConfig,
  query: string,
): Promise<ImageResult | null> {
  if (config.pexelsApiKey) {
    const list = await pexelsSearch(config.pexelsApiKey, query, {
      orientation: 'portrait',
      perPage: 3,
    });
    if (list?.length) {
      const chosen = list[Math.floor(Math.random() * list.length)];
      const buffer = await fetchImageBuffer(chosen.url);
      if (buffer) return { url: chosen.url, buffer, source: 'pexels' };
    }
  }
  if (config.pixabayApiKey) {
    const list = await pixabaySearch(config.pixabayApiKey, query, {
      orientation: 'vertical',
      perPage: 5,
    });
    if (list?.length) {
      const chosen = list[Math.floor(Math.random() * list.length)];
      const buffer = await fetchImageBuffer(chosen.largeUrl ?? chosen.url);
      if (buffer) return { url: chosen.url, buffer, source: 'pixabay' };
    }
  }
  return null;
}

/** Fallback avatar when no Pixabay/Pexels key: fetch a random-but-stable image by seed (e.g. handle). */
export async function getPlaceholderAvatarImage(seed: string): Promise<Buffer | null> {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
  return fetchImageBuffer(url);
}

/** Get one image buffer for header (landscape). Prefer Pexels landscape, else Pixabay horizontal. */
export async function getHeaderImage(
  config: ImageProviderConfig,
  query: string,
): Promise<ImageResult | null> {
  if (config.pexelsApiKey) {
    const list = await pexelsSearch(config.pexelsApiKey, query, {
      orientation: 'landscape',
      perPage: 3,
    });
    if (list?.length) {
      const chosen = list[Math.floor(Math.random() * list.length)];
      const buffer = await fetchImageBuffer(chosen.url);
      if (buffer) return { url: chosen.url, buffer, source: 'pexels' };
    }
  }
  if (config.pixabayApiKey) {
    const list = await pixabaySearch(config.pixabayApiKey, query, {
      orientation: 'horizontal',
      perPage: 5,
    });
    if (list?.length) {
      const chosen = list[Math.floor(Math.random() * list.length)];
      const buffer = await fetchImageBuffer(chosen.largeUrl ?? chosen.url);
      if (buffer) return { url: chosen.url, buffer, source: 'pixabay' };
    }
  }
  return null;
}
