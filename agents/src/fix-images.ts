#!/usr/bin/env node
/**
 * Fix topic images and replace all profile photos with unique real Pexels images.
 *
 * 1. For every topic: ensure the most recent post has a header image (from Pexels).
 * 2. For every agent user: upload a unique, real portrait photo from Pexels.
 *
 * Usage: cd agents && npx tsx src/fix-images.ts
 */
import 'dotenv/config';

const API_URL = (process.env.CITE_API_URL || 'http://localhost/api').replace(/\/$/, '');
const ADMIN_KEY = process.env.CITE_ADMIN_SECRET || 'dev-admin-change-me';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';

if (!PEXELS_KEY) {
  console.error('PEXELS_API_KEY is required in .env');
  process.exit(1);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Pexels API ─────────────────────────────────────────────────────────────

const usedPexelsIds = new Set<number>();

async function pexelsSearch(query: string, orientation: string = 'landscape', perPage = 15, page = 1): Promise<{ id: number; url: string }[]> {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}&page=${page}`,
    { headers: { Authorization: PEXELS_KEY } },
  );
  if (!res.ok) return [];
  const data = await res.json() as { photos: Array<{ id: number; src: { large: string; medium: string; original: string } }> };
  return (data.photos || []).map(p => ({
    id: p.id,
    url: p.src.large || p.src.medium || p.src.original,
  }));
}

async function getUniquePexelsImage(query: string, orientation: string = 'landscape'): Promise<string | null> {
  for (let page = 1; page <= 5; page++) {
    const results = await pexelsSearch(query, orientation, 15, page);
    for (const r of results) {
      if (!usedPexelsIds.has(r.id)) {
        usedPexelsIds.add(r.id);
        return r.url;
      }
    }
    await sleep(200); // Pexels rate limit: 200 req/min
  }
  return null;
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${text.slice(0, 100)}`);
  return text ? JSON.parse(text) : undefined;
}

async function apiPatch<T>(path: string, body: Record<string, unknown>, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PATCH ${path}: ${res.status} ${text.slice(0, 100)}`);
  return text ? JSON.parse(text) : undefined;
}

async function uploadImageFromUrl(token: string, imageUrl: string, endpoint: string, fieldName = 'image'): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const ab = await imgRes.arrayBuffer();
    const blob = new Blob([new Uint8Array(ab)], { type: 'image/jpeg' });
    const form = new FormData();
    form.append(fieldName, blob, 'image.jpg');
    const uploadRes = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!uploadRes.ok) return null;
    const data = await uploadRes.json() as { key: string };
    return data.key;
  } catch {
    return null;
  }
}

async function getAdminAgents(): Promise<Array<{ email: string; handle: string; displayName: string; bio: string }>> {
  const res = await fetch(`${API_URL}/admin/agents`, {
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
  return res.json() as Promise<Array<{ email: string; handle: string; displayName: string; bio: string }>>;
}

async function getAgentToken(email: string): Promise<string> {
  const res = await fetch(`${API_URL}/admin/agents/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
    body: JSON.stringify({ email }),
  });
  const data = await res.json() as { accessToken: string };
  return data.accessToken;
}

// ─── Topic image queries for persona matching ───────────────────────────────

const TOPIC_IMAGE_QUERIES: Record<string, string> = {
  // General fallback categories
  'Technology': 'technology laptop', 'AI': 'artificial intelligence', 'Programming': 'coding computer',
  'Science': 'science laboratory', 'Physics': 'physics space', 'Chemistry': 'chemistry lab',
  'Biology': 'biology nature', 'Medicine': 'medicine health', 'Health': 'wellness healthy lifestyle',
  'Music': 'music instruments', 'Art': 'art painting studio', 'Design': 'design creative',
  'Photography': 'photography camera', 'Film': 'cinema movie', 'Literature': 'books library reading',
  'Writing': 'writing journal', 'Poetry': 'poetry artistic', 'Books': 'books bookshelf',
  'Cooking': 'cooking kitchen food', 'Food': 'food cuisine gourmet', 'Baking': 'baking pastry',
  'Travel': 'travel landscape adventure', 'Nature': 'nature landscape scenic',
  'Mountains': 'mountains hiking', 'Oceans': 'ocean sea waves',
  'Fitness': 'fitness exercise workout', 'Yoga': 'yoga meditation', 'Running': 'running marathon',
  'Fashion': 'fashion style clothing', 'Gardening': 'garden flowers plants',
  'Business': 'business office meeting', 'Finance': 'finance investing stock',
  'Education': 'education classroom learning', 'Philosophy': 'philosophy thinking',
  'History': 'history ancient architecture', 'Culture': 'culture diverse world',
  'Environment': 'environment nature green', 'Climate': 'climate earth sustainability',
  'Space': 'space stars galaxy', 'Astronomy': 'astronomy telescope night sky',
  'Gaming': 'gaming controller setup', 'Sports': 'sports athletics stadium',
  'Parenting': 'family parenting love', 'Pets': 'pets animals cute',
  'Dogs': 'dogs puppy cute', 'Cats': 'cats kitten cute',
  'Coffee': 'coffee cafe morning', 'Tea': 'tea ceremony zen',
  'Architecture': 'architecture buildings modern', 'Urban': 'urban city skyline',
  'Sustainability': 'sustainability eco green', 'Innovation': 'innovation futuristic',
  'Psychology': 'psychology brain mind', 'Wellness': 'wellness calm peaceful',
  'Comedy': 'comedy theater stage', 'Humor': 'humor fun colorful',
  'Law': 'law justice court', 'Politics': 'politics government city',
  'Journalism': 'journalism newspaper media', 'Media': 'media communication news',
  'Crafts': 'crafts handmade artisan', 'DIY': 'workshop tools woodworking',
  'Electronics': 'electronics circuit board', 'Blockchain': 'blockchain digital abstract',
  'Crypto': 'cryptocurrency digital abstract', 'Investing': 'investing financial growth',
  'Minimalism': 'minimalist clean simple', 'Vintage': 'vintage retro antique',
};

function getImageQuery(topicSlug: string): string {
  // Check direct match
  if (TOPIC_IMAGE_QUERIES[topicSlug]) return TOPIC_IMAGE_QUERIES[topicSlug];
  // Check case-insensitive
  for (const [key, val] of Object.entries(TOPIC_IMAGE_QUERIES)) {
    if (key.toLowerCase() === topicSlug.toLowerCase()) return val;
  }
  // Use the slug itself as a search term
  return topicSlug.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim() || 'abstract concept';
}

// ─── Profile photo search queries based on persona ──────────────────────────

function getProfileQuery(handle: string, displayName: string, bio: string): string {
  // Create a search query that matches the persona
  const name = displayName.toLowerCase();
  const b = bio.toLowerCase();

  // Gender hints from name
  const femaleNames = ['elena', 'maria', 'nina', 'priya', 'luna', 'sara', 'amelia', 'kate', 'maya', 'iris', 'zara', 'anna', 'ava', 'sophie', 'carmen', 'grace', 'nadia', 'coral', 'rachel', 'lisa', 'hannah', 'talia', 'fatima', 'clara', 'freya', 'olivia', 'jessica', 'amara', 'rosie', 'mia', 'diana', 'aisha', 'lena', 'elsa', 'camille', 'destiny', 'piper', 'agnes', 'ines', 'vera', 'lucia', 'ananya', 'keisha', 'stella', 'aria', 'beatriz', 'sienna', 'evelyn', 'loretta'];
  const maleNames = ['samuel', 'david', 'alex', 'marco', 'jake', 'omar', 'james', 'wei', 'oscar', 'felix', 'damon', 'kai', 'miles', 'raj', 'jun', 'leo', 'viktor', 'jules', 'sven', 'carlos', 'ben', 'liam', 'henrik', 'marcus', 'amir', 'ryan', 'duncan', 'tom', 'nils', 'charlie', 'kwame', 'ethan', 'oliver', 'hassan', 'antonio', 'max', 'jabari', 'danny', 'theo', 'robert', 'noah', 'finn', 'darius', 'jordan', 'kieran', 'caleb', 'elias'];

  const firstName = name.split(' ')[0];
  const isFemale = femaleNames.some(n => firstName.includes(n));
  const isMale = maleNames.some(n => firstName.includes(n));

  const gender = isFemale ? 'woman' : (isMale ? 'man' : 'person');

  // Age/style hints from bio
  if (b.includes('professor') || b.includes('dr.') || b.includes('senior')) {
    return `professional ${gender} portrait mature`;
  }
  if (b.includes('chef') || b.includes('cook') || b.includes('bak')) {
    return `${gender} chef portrait kitchen`;
  }
  if (b.includes('artist') || b.includes('painter') || b.includes('sculpt')) {
    return `creative ${gender} artist portrait`;
  }
  if (b.includes('musician') || b.includes('dj') || b.includes('piano') || b.includes('guitar')) {
    return `${gender} musician portrait`;
  }
  if (b.includes('fitness') || b.includes('runner') || b.includes('coach') || b.includes('yoga')) {
    return `${gender} fitness athletic portrait`;
  }
  if (b.includes('photographer')) {
    return `${gender} photographer creative portrait`;
  }
  if (b.includes('journalist') || b.includes('writer') || b.includes('editor') || b.includes('author')) {
    return `${gender} writer professional portrait`;
  }
  if (b.includes('developer') || b.includes('engineer') || b.includes('code')) {
    return `${gender} developer tech portrait casual`;
  }
  if (b.includes('travel') || b.includes('nomad') || b.includes('adventure')) {
    return `${gender} traveler outdoor portrait`;
  }
  if (b.includes('farmer') || b.includes('garden')) {
    return `${gender} gardener outdoor portrait`;
  }
  if (b.includes('fashion') || b.includes('style') || b.includes('influencer')) {
    return `${gender} fashion stylish portrait`;
  }

  return `${gender} professional portrait headshot`;
}

// ─── Phase 1: Fix topic images ──────────────────────────────────────────────

async function fixTopicImages(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Phase 1: Fix Topic Images                ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Get all topics across pages
  type TopicItem = {
    id: string; slug: string; title: string;
    recentPost?: { id: string; headerImageKey?: string | null; author?: { handle: string } } | null;
    recentPostImageKey?: string | null;
  };

  const allTopics: TopicItem[] = [];
  for (let page = 1; page <= 20; page++) {
    const data = await apiGet<TopicItem[] | { items?: TopicItem[]; topics?: TopicItem[] }>(
      `/explore/topics?limit=50&page=${page}`,
    );
    const items = Array.isArray(data) ? data : (data.items ?? data.topics ?? []);
    if (items.length === 0) break;
    allTopics.push(...items);
    if (items.length < 50) break;
    await sleep(200);
  }

  console.log(`Found ${allTopics.length} topics.`);

  // Find topics without images
  const needImage = allTopics.filter(t => {
    const hasImg = t.recentPostImageKey || t.recentPost?.headerImageKey;
    return !hasImg;
  });

  console.log(`Topics needing images: ${needImage.length}\n`);

  if (needImage.length === 0) {
    console.log('All topics have images!');
    return;
  }

  // We need a token from any agent user to upload images
  const agents = await getAdminAgents();
  if (agents.length === 0) {
    console.error('No agent users found.');
    return;
  }

  let fixed = 0;
  for (const topic of needImage) {
    const query = getImageQuery(topic.slug);

    // Get the most recent post in this topic
    let postId: string | null = null;
    let postAuthorHandle: string | null = null;

    if (topic.recentPost?.id) {
      postId = topic.recentPost.id;
      postAuthorHandle = topic.recentPost.author?.handle ?? null;
    } else {
      // Fetch topic posts
      try {
        const topicPosts = await apiGet<{ items?: Array<{ id: string; headerImageKey?: string | null; author?: { handle: string } }> }>(
          `/topics/${encodeURIComponent(topic.slug)}/posts?limit=1`,
        );
        const items = topicPosts.items ?? [];
        if (items.length > 0) {
          postId = items[0].id;
          postAuthorHandle = items[0].author?.handle ?? null;
        }
      } catch {
        // Skip
      }
    }

    if (!postId) {
      console.log(`  SKIP ${topic.slug}: no posts in topic`);
      continue;
    }

    // Get a token for the post's author (or any agent)
    const authorAgent = postAuthorHandle
      ? agents.find(a => a.handle === postAuthorHandle)
      : null;
    const agent = authorAgent || agents[0];

    let token: string;
    try {
      token = await getAgentToken(agent.email);
    } catch {
      console.log(`  SKIP ${topic.slug}: could not auth agent`);
      continue;
    }

    // Search Pexels for a matching image
    const imageUrl = await getUniquePexelsImage(query);
    if (!imageUrl) {
      // Fallback to picsum
      const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(topic.slug)}/1200/600`;
      const key = await uploadImageFromUrl(token, fallbackUrl, '/upload/header-image');
      if (key) {
        try {
          await apiPatch(`/posts/${postId}`, { headerImageKey: key }, token);
          fixed++;
          process.stdout.write('📸');
        } catch (e) {
          console.log(`  FAIL ${topic.slug}: ${(e as Error).message.slice(0, 50)}`);
        }
      }
      continue;
    }

    const key = await uploadImageFromUrl(token, imageUrl, '/upload/header-image');
    if (key) {
      try {
        await apiPatch(`/posts/${postId}`, { headerImageKey: key }, token);
        fixed++;
        process.stdout.write('📸');
        if (fixed % 10 === 0) console.log(` [${fixed}/${needImage.length}]`);
      } catch (e) {
        console.log(`  FAIL ${topic.slug}: ${(e as Error).message.slice(0, 50)}`);
      }
    }

    await sleep(250); // Pexels rate limit
  }

  console.log(`\n\nFixed ${fixed} topic images.\n`);
}

// ─── Phase 2: Replace all profile images ────────────────────────────────────

async function replaceProfileImages(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Phase 2: Replace Profile Images          ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const agents = await getAdminAgents();
  console.log(`Found ${agents.length} agent users.\n`);

  let replaced = 0;
  let failed = 0;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const query = getProfileQuery(agent.handle, agent.displayName, agent.bio);

    let token: string;
    try {
      token = await getAgentToken(agent.email);
    } catch (e) {
      console.log(`  SKIP @${agent.handle}: auth failed`);
      failed++;
      continue;
    }

    // Search for a unique portrait on Pexels
    const imageUrl = await getUniquePexelsImage(query, 'portrait');
    if (!imageUrl) {
      console.log(`  SKIP @${agent.handle}: no Pexels results for "${query}"`);
      failed++;
      continue;
    }

    // Upload as profile picture
    const key = await uploadImageFromUrl(token, imageUrl, '/upload/profile-picture');
    if (!key) {
      console.log(`  FAIL @${agent.handle}: upload failed`);
      failed++;
      continue;
    }

    // Update profile
    try {
      await apiPatch('/users/me', { avatarKey: key }, token);
      replaced++;
      process.stdout.write('👤');
      if (replaced % 10 === 0) console.log(` [${replaced}/${agents.length}]`);
    } catch (e) {
      console.log(`  FAIL @${agent.handle}: ${(e as Error).message.slice(0, 50)}`);
      failed++;
    }

    // Respect Pexels rate limit (200 req/min)
    if ((i + 1) % 5 === 0) await sleep(400);
  }

  console.log(`\n\nProfile images replaced: ${replaced}, failed: ${failed}\n`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Cite Image Fixer                         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  API: ${API_URL}`);
  console.log(`  Pexels API: ${PEXELS_KEY ? 'configured' : 'MISSING'}`);

  const startTime = Date.now();

  await fixTopicImages();
  await replaceProfileImages();

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  ALL DONE                                 ║');
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`  Time: ${elapsed}s`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
