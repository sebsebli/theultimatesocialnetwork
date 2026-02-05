#!/usr/bin/env node
import 'dotenv/config';
/**
 * Spawn N AI agents (optionally in parallel). For each agent:
 * 1. Create a persona (LLM generates handle, displayName, bio, behavior from character type).
 * 2. Sign up and set profile from persona (bio, handle, displayName; profile image required—Pixabay/Pexels or placeholder).
 * 3. Run the agent loop: persona is "called" many times with network context (feed, explore, notifications, DMs);
 *    each round they surf, then do one action; we track action history and inject it each round.
 *
 * With --resume: load stored personas and run their loops in parallel (re-auth with stored email).
 * With --resume-from-db: list agent users from API (GET /admin/agents) and run their loops (no personas file).
 * With --save: after a fresh run, save personas to a JSON file so you can --resume next time.
 *
 * Usage:
 *   npm run run
 *   npm run run -- --agents 5 --actions 10
 *   npm run run -- --agents 3 --actions 5 --save
 *   npm run run -- --resume --actions 5
 *   npm run run -- --resume-from-db --actions 40
 *   npm run run -- --resume --personas-file ./my-personas.json
 *   npm run run -- --seed-db --agents 3 --actions 5
 *   npm run run -- --real-personas --agents 20 --actions 30  (LLM creates N real social network personas)
 *   npm run run -- --run-batch-size 5  (default 8; lower if API returns 503)
 *   npm run run -- --reupload-profile-photos   (re-upload profile photo for ALL agent users)
 *   npm run run -- --add-post-title-images     (add title image to most existing posts; use --post-title-image-ratio 0.7 for 70%)
 *
 * With --seed-db: create agent users directly in DB (admin POST /admin/agents/seed).
 * No signup/tokenization; user is written to DB, indexed in Meilisearch, and Neo4j user node created.
 *
 * Requires: Cite API running; OPENAI_API_KEY set (or use --ollama for local Ollama).
 * For --seed-db, CITE_ADMIN_SECRET required.
 * Optional: PIXABAY_API_KEY or PEXELS_API_KEY for profile images; otherwise a placeholder avatar is used.
 *
 * Ollama: use --ollama or USE_OLLAMA=1 to use local Ollama (e.g. granite4:latest) instead of OpenAI.
 * Set OLLAMA_MODEL (default granite4:latest) and OLLAMA_BASE_URL (default http://localhost:11434).
 */

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { createApiClient, devSignup } from './api-client.js';
import { getAvatarImage, getPlaceholderAvatarImage, getHeaderImage } from './image-provider.js';
import { randomCharacter, getCharacterByType, characterFromStoredPersona } from './characters.js';
import { createPersona, createRealSocialPersona } from './persona.js';
import { runAgentLoop } from './agent.js';
import {
  loadPersonas,
  savePersonas,
  getPersonasFilePath,
  type StoredPersona,
} from './personas-store.js';

// --- Config from env and CLI ---
function getConfig() {
  const env = process.env as Record<string, string | undefined>;
  const args = process.argv.slice(2);
  let agentsCount = parseInt(env.AGENTS_COUNT ?? '3', 10);
  let actionsPerAgent = parseInt(env.ACTIONS_PER_AGENT ?? '8', 10);
  let save = env.CITE_AGENTS_SAVE === 'true' || env.CITE_AGENTS_SAVE === '1';
  let resume = env.CITE_AGENTS_RESUME === 'true' || env.CITE_AGENTS_RESUME === '1';
  let resumeFromDb = env.CITE_AGENTS_RESUME_FROM_DB === 'true' || env.CITE_AGENTS_RESUME_FROM_DB === '1';
  let seedDb = env.CITE_AGENTS_SEED_DB === 'true' || env.CITE_AGENTS_SEED_DB === '1';
  let resumeBatchSize = parseInt(env.CITE_AGENTS_RESUME_BATCH_SIZE ?? '5', 10);
  let runBatchSize = parseInt(env.CITE_AGENTS_RUN_BATCH_SIZE ?? '8', 10);
  let privateRatio = parseFloat(env.CITE_AGENTS_PRIVATE_RATIO ?? '0.15');
  let useOllama = env.USE_OLLAMA === 'true' || env.USE_OLLAMA === '1';
  let useGemini = env.USE_GEMINI === 'true' || env.USE_GEMINI === '1';
  let realPersonas = env.CITE_AGENTS_REAL_PERSONAS === 'true' || env.CITE_AGENTS_REAL_PERSONAS === '1';
  let reuploadProfilePhotos = env.CITE_AGENTS_REUPLOAD_PROFILE_PHOTOS === 'true' || env.CITE_AGENTS_REUPLOAD_PROFILE_PHOTOS === '1';
  let addPostTitleImages = env.CITE_AGENTS_ADD_POST_TITLE_IMAGES === 'true' || env.CITE_AGENTS_ADD_POST_TITLE_IMAGES === '1';
  let postTitleImageRatio = parseFloat(env.CITE_AGENTS_POST_TITLE_IMAGE_RATIO ?? '0.7');
  let version = (env.CITE_AGENTS_VERSION ?? 'default') as 'default' | 'posts';
  let personasFile: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agents' && args[i + 1]) {
      agentsCount = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--actions' && args[i + 1]) {
      actionsPerAgent = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--save') {
      save = true;
    } else if (args[i] === '--resume') {
      resume = true;
    } else if (args[i] === '--resume-from-db') {
      resumeFromDb = true;
    } else if (args[i] === '--seed-db') {
      seedDb = true;
    } else if (args[i] === '--resume-batch-size' && args[i + 1]) {
      resumeBatchSize = Math.max(1, parseInt(args[i + 1], 10));
      i++;
    } else if (args[i] === '--run-batch-size' && args[i + 1]) {
      runBatchSize = Math.max(1, parseInt(args[i + 1], 10));
      i++;
    } else if (args[i] === '--private-ratio' && args[i + 1]) {
      privateRatio = Math.max(0, Math.min(1, parseFloat(args[i + 1])));
      i++;
    } else if (args[i] === '--personas-file' && args[i + 1]) {
      personasFile = args[i + 1];
      i++;
    } else if (args[i] === '--ollama') {
      useOllama = true;
    } else if (args[i] === '--gemini') {
      useGemini = true;
    } else if (args[i] === '--real-personas') {
      realPersonas = true;
    } else if (args[i] === '--reupload-profile-photos') {
      reuploadProfilePhotos = true;
    } else if (args[i] === '--add-post-title-images') {
      addPostTitleImages = true;
    } else if (args[i] === '--post-title-image-ratio' && args[i + 1]) {
      postTitleImageRatio = Math.max(0, Math.min(1, parseFloat(args[i + 1])));
      i++;
    } else if (args[i] === '--version' && args[i + 1]) {
      version = args[i + 1] === 'posts' ? 'posts' : 'default';
      i++;
    }
  }
  const minPostsFromEnv = Math.max(0, parseInt(env.CITE_AGENTS_MIN_POSTS ?? '', 10));
  const minPostsExplicit = Number.isNaN(minPostsFromEnv) ? undefined : minPostsFromEnv;
  const minPostsPerAgent =
    version === 'posts'
      ? Math.max(2, Math.ceil(actionsPerAgent * 0.6))
      : (minPostsExplicit ?? Math.max(0, parseInt(env.CITE_AGENTS_MIN_POSTS ?? '2', 10)));
  return {
    citeApiUrl: env.CITE_API_URL ?? 'http://localhost/api',
    citeAdminSecret: env.CITE_ADMIN_SECRET ?? 'dev-admin-change-me',
    citeDevToken: env.CITE_DEV_TOKEN ?? '123456',
    citeAgentSecret: env.CITE_AGENT_SECRET,
    disableBeta: env.CITE_DISABLE_BETA === 'true' || env.CITE_DISABLE_BETA === '1',
    openaiApiKey: env.OPENAI_API_KEY ?? '',
    openaiModel: env.OPENAI_MODEL ?? 'gpt-4o-mini',
    useOllama,
    ollamaModel: env.OLLAMA_MODEL ?? 'granite4:latest',
    ollamaBaseUrl: (env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, ''),
    useGemini,
    geminiApiKey: env.GEMINI_API_KEY ?? '',
    geminiModel: env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    pixabayApiKey: env.PIXABAY_API_KEY,
    pexelsApiKey: env.PEXELS_API_KEY,
    agentsCount: Math.max(1, agentsCount),
    actionsPerAgent: Math.max(1, actionsPerAgent),
    save,
    resume,
    resumeFromDb,
    seedDb,
    resumeBatchSize: Math.max(1, resumeBatchSize),
    runBatchSize: Math.max(1, runBatchSize),
    privateRatio,
    realPersonas,
    reuploadProfilePhotos,
    addPostTitleImages,
    postTitleImageRatio: Math.max(0, Math.min(1, postTitleImageRatio)),
    personasFile: personasFile ?? getPersonasFilePath(),
    version,
    minPostsPerAgent,
  };
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

const API_RETRY_MAX = 4;
const API_RETRY_BASE_MS = 2000;

function isRetryableApiError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes('503') || msg.includes('500') || msg.includes('502') || msg.includes('fetch failed');
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= API_RETRY_MAX; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < API_RETRY_MAX && isRetryableApiError(e)) {
        const delayMs = API_RETRY_BASE_MS * Math.pow(2, attempt - 1);
        console.warn(`${label}: retry ${attempt}/${API_RETRY_MAX} in ${delayMs / 1000}s (${(e as Error).message.slice(0, 60)}...)`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/** Re-upload profile photo for all agent users (Pixabay/Pexels or placeholder). */
async function runReuploadProfilePhotos(
  config: ReturnType<typeof getConfig>,
  api: ReturnType<typeof createApiClient>,
): Promise<void> {
  const list = await api.listAgentUsers();
  if (list.length === 0) {
    console.log('No agent users (@agents.local). Nothing to do.');
    return;
  }
  const imageConfig = {
    pixabayApiKey: config.pixabayApiKey,
    pexelsApiKey: config.pexelsApiKey,
  };
  const usedImageUrls = new Set<string>();
  console.log(`Re-uploading profile photos for ${list.length} agent user(s) (each profile gets a unique image)...`);
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    let token: string;
    try {
      if (config.citeAgentSecret) {
        const auth = await api.authViaAgentApi(u.email);
        token = auth.accessToken;
      } else if (config.citeAdminSecret) {
        token = (await api.getAgentToken(u.email)).accessToken;
      } else {
        console.warn(`[${i + 1}/${list.length}] Skip @${u.handle}: need CITE_ADMIN_SECRET or CITE_AGENT_SECRET.`);
        continue;
      }
    } catch (e) {
      console.error(`[${i + 1}/${list.length}] @${u.handle} auth failed:`, (e as Error).message);
      continue;
    }
    let avatarBuffer: Buffer | null = null;
    for (let page = 1; page <= 20 && !avatarBuffer; page++) {
      const avatarImg = await getAvatarImage(imageConfig, 'portrait', {
        excludeUrls: usedImageUrls,
        page,
        perPage: 15,
      });
      if (avatarImg) {
        usedImageUrls.add(avatarImg.url);
        avatarBuffer = avatarImg.buffer;
      }
    }
    if (!avatarBuffer) avatarBuffer = await getPlaceholderAvatarImage(u.handle);
    if (!avatarBuffer) {
      console.error(`[${i + 1}/${list.length}] @${u.handle}: no image available, skip.`);
      continue;
    }
    try {
      const up = await api.uploadProfilePicture(token, avatarBuffer, `avatar-${u.handle}.jpg`);
      await api.updateMe(token, { avatarKey: up.key });
      console.log(`[${i + 1}/${list.length}] @${u.handle} profile photo updated.`);
    } catch (e) {
      console.error(`[${i + 1}/${list.length}] @${u.handle} upload/update failed:`, (e as Error).message);
    }
  }
  console.log('Profile photo re-upload done.');
}

/** Add a title/header image to most existing posts by agent users (no image yet). */
async function runAddPostTitleImages(
  config: ReturnType<typeof getConfig>,
  api: ReturnType<typeof createApiClient>,
): Promise<void> {
  const list = await api.listAgentUsers();
  if (list.length === 0) {
    console.log('No agent users (@agents.local). Nothing to do.');
    return;
  }
  const imageConfig = {
    pixabayApiKey: config.pixabayApiKey,
    pexelsApiKey: config.pexelsApiKey,
  };
  const ratio = config.postTitleImageRatio;
  let totalAdded = 0;
  let totalSkipped = 0;
  console.log(`Adding title images to ~${Math.round(ratio * 100)}% of posts without one (${list.length} users)...`);
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    let token: string;
    try {
      if (config.citeAgentSecret) {
        token = (await api.authViaAgentApi(u.email)).accessToken;
      } else if (config.citeAdminSecret) {
        token = (await api.getAgentToken(u.email)).accessToken;
      } else {
        continue;
      }
    } catch (e) {
      console.error(`[${i + 1}/${list.length}] @${u.handle} auth failed:`, (e as Error).message);
      continue;
    }
    // Use /users/me/posts (current user's posts) so we don't rely on handle resolution
    let posts: { id: string; headerImageKey?: string | null }[];
    try {
      const data = (await api.getMyPosts(token, 200, 1)) as
        | { items?: { id: string; headerImageKey?: string | null }[]; posts?: { id: string; headerImageKey?: string | null }[] }
        | { id: string; headerImageKey?: string | null }[];
      if (Array.isArray(data)) {
        posts = data as { id: string; headerImageKey?: string | null }[];
      } else if (data && typeof data === 'object') {
        const raw = (data as { items?: unknown[] }).items ?? (data as { posts?: unknown[] }).posts ?? [];
        posts = raw as { id: string; headerImageKey?: string | null }[];
      } else {
        posts = [];
      }
    } catch (e) {
      console.error(`[${i + 1}/${list.length}] @${u.handle} get posts failed:`, (e as Error).message);
      continue;
    }
    // Log every user so we can see who has posts
    console.log(`[${i + 1}/${list.length}] @${u.handle}: ${posts.length} posts`);
    const withoutImage = posts.filter((p) => !p?.headerImageKey);
    const toAdd = ratio >= 1 ? withoutImage : withoutImage.filter((_, idx) => (idx / Math.max(1, withoutImage.length)) < ratio);
    if (posts.length > 0 && toAdd.length === 0 && withoutImage.length === 0) {
      console.log(`  → all already have title image`);
    } else if (toAdd.length > 0) {
      console.log(`  → adding title image to ${toAdd.length} of ${withoutImage.length} without image`);
    }
    for (const post of toAdd) {
      let imageUrl: string | undefined;
      const headerImg = await getHeaderImage(imageConfig, 'article');
      if (headerImg?.url) imageUrl = headerImg.url;
      if (!imageUrl) imageUrl = `https://picsum.photos/seed/${encodeURIComponent(post.id)}/1200/600`;
      try {
        const { key } = await api.uploadHeaderImageFromUrl(token, imageUrl);
        await api.updatePost(token, post.id, { headerImageKey: key });
        totalAdded++;
        process.stdout.write('.');
      } catch (e) {
        totalSkipped++;
        console.warn(`\nPost ${post.id} failed:`, (e as Error).message);
      }
    }
    if (toAdd.length > 0) console.log(`\n[${i + 1}/${list.length}] @${u.handle}: ${toAdd.length} post(s) got title image.`);
  }
  console.log(`\nDone. Added title images: ${totalAdded}, failed: ${totalSkipped}.`);
}

/** Run one agent from a stored persona (re-auth, then loop only). */
async function runResumedAgent(
  index: number,
  total: number,
  config: ReturnType<typeof getConfig>,
  openai: OpenAI | undefined,
  gemini: GoogleGenAI | undefined,
  api: ReturnType<typeof createApiClient>,
  stored: StoredPersona,
): Promise<number> {
  const character =
    stored.characterType === 'custom'
      ? characterFromStoredPersona(stored.displayName, stored.bio, stored.behavior, stored.topics ?? [])
      : getCharacterByType(stored.characterType);
  if (!character) {
    console.warn(`[${index + 1}/${total}] Unknown characterType "${stored.characterType}", skipping.`);
    return 0;
  }

  let token: string;
  try {
    if (config.citeAgentSecret) {
      const auth = await api.authViaAgentApi(stored.email);
      token = auth.accessToken;
    } else if (config.citeAdminSecret) {
      try {
        const auth = await api.getAgentToken(stored.email);
        token = auth.accessToken;
      } catch (adminErr: unknown) {
        const msg = adminErr instanceof Error ? adminErr.message : String(adminErr);
        if (msg.includes('404') || msg.includes('Cannot POST')) {
          const auth = await devSignup(api, stored.email, config.citeDevToken);
          token = auth.accessToken;
        } else {
          throw adminErr;
        }
      }
    } else {
      const auth = await devSignup(api, stored.email, config.citeDevToken);
      token = auth.accessToken;
    }
  } catch (e) {
    console.error(`[${index + 1}/${total}] Re-auth failed for @${stored.handle}:`, (e as Error).message);
    return 0;
  }

  const model = config.useGemini ? config.geminiModel : (config.useOllama ? config.ollamaModel : config.openaiModel);
  console.log(`[${index + 1}/${total}] Resumed ${stored.displayName} (@${stored.handle}) — ${config.actionsPerAgent} actions...`);
  let actionsDone = 0;
  try {
    actionsDone = await runAgentLoop({
      openai,
      gemini,
      model,
      api,
      ctx: {
        token,
        handle: stored.handle,
        displayName: stored.displayName,
        character,
        persona: {
          displayName: stored.displayName,
          handle: stored.handle,
          bio: stored.bio,
          behavior: stored.behavior,
        },
        imageConfig: { pixabayApiKey: config.pixabayApiKey, pexelsApiKey: config.pexelsApiKey },
      },
      maxActions: config.actionsPerAgent,
      minPosts: config.minPostsPerAgent,
      version: config.version,
      onAction: () => process.stdout.write('.'),
    });
  } catch (e) {
    console.error(`[${index + 1}/${total}] Agent loop error:`, (e as Error).message);
  }
  console.log(` [${index + 1}/${total}] Done. Actions: ${actionsDone}`);
  return actionsDone;
}

async function main() {
  const config = getConfig();
  const model = config.useGemini ? config.geminiModel : (config.useOllama ? config.ollamaModel : config.openaiModel);
  const provider = config.useGemini ? 'Gemini' : (config.useOllama ? 'Ollama' : 'OpenAI');

  console.log('Cite Agents Runner');
  console.log('  API:', config.citeApiUrl);
  console.log(`  LLM: ${provider} (${model})`);
  console.log('  Actions per agent:', config.actionsPerAgent);
  console.log('  Min posts per agent:', config.minPostsPerAgent);
  if (config.version === 'posts') console.log('  Version: posts (prioritize create_post)');
  if (config.resume) {
    console.log('  Mode: resume (load personas from file)');
    console.log('  Personas file:', config.personasFile);
  } else if (config.resumeFromDb) {
    console.log('  Mode: resume-from-db (list agent users from API, run loops)');
  } else {
    console.log('  Agents (parallel):', config.agentsCount);
    console.log('  Run batch size:', config.runBatchSize, '(seed/upload in batches to avoid 503)');
    if (config.realPersonas) console.log('  Personas: LLM-created real social network personas');
    if (config.seedDb) {
      console.log('  Seed DB: yes (profiles written directly, Meilisearch + Neo4j)');
      if (config.privateRatio > 0) console.log('  Private profiles (isProtected):', Math.round(config.privateRatio * 100) + '%');
    }
    if (config.save) console.log('  Save personas: yes');
  }
  if (!config.useOllama && !config.useGemini && !config.openaiApiKey) {
    console.error('OPENAI_API_KEY is required (or use --ollama or --gemini).');
    process.exit(1);
  }
  if (config.useGemini && !config.geminiApiKey) {
    console.error('GEMINI_API_KEY is required when using --gemini.');
    process.exit(1);
  }
  if (config.seedDb && !config.citeAdminSecret) {
    console.error('CITE_ADMIN_SECRET is required when using --seed-db.');
    process.exit(1);
  }
  if ((config.resume || config.resumeFromDb) && !config.citeAdminSecret && !config.citeDevToken) {
    console.error('For --resume / --resume-from-db set CITE_ADMIN_SECRET (for admin token) or CITE_DEV_TOKEN (for dev verify).');
    process.exit(1);
  }
  const openai = config.useOllama
    ? new OpenAI({
      baseURL: `${config.ollamaBaseUrl}/v1`,
      apiKey: 'ollama',
    })
    : (config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : undefined);

  const gemini = config.useGemini
    ? new GoogleGenAI({ apiKey: config.geminiApiKey })
    : undefined;

  const api = createApiClient({
    baseUrl: config.citeApiUrl,
    adminKey: config.citeAdminSecret,
    devToken: config.citeDevToken,
    agentSecret: config.citeAgentSecret,
  });

  const maxApiRetries = 5;
  const apiRetryDelayMs = 5000;
  let apiOk = false;
  for (let attempt = 1; attempt <= maxApiRetries; attempt++) {
    try {
      await api.checkHandleAvailable('_test_');
      apiOk = true;
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const is502OrUnavailable = msg.includes('502') || msg.includes('fetch failed') || msg.includes('ECONNREFUSED');
      if (is502OrUnavailable && attempt < maxApiRetries) {
        console.warn(`API not ready (${msg.slice(0, 60)}...). Retry ${attempt}/${maxApiRetries} in ${apiRetryDelayMs / 1000}s.`);
        await new Promise((r) => setTimeout(r, apiRetryDelayMs));
        continue;
      }
      if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
        console.error('Cite API is not reachable at', config.citeApiUrl);
        console.error('Start the API (e.g. from apps/api: npm run start:dev) and try again.');
      } else if (msg.includes('404') || msg.includes('<!DOCTYPE html>')) {
        console.error('Got 404 or HTML from', config.citeApiUrl, '— wrong server or path.');
        console.error('Set CITE_API_URL to the API base URL (including /api):');
        console.error('  Docker:  CITE_API_URL=http://localhost/api       (ensure stack is running: npm run deploy:dev)');
        console.error('  Local:   CITE_API_URL=http://localhost:3000/api   (run API in apps/api first)');
      } else {
        console.error('API check failed:', msg.slice(0, 200));
      }
      process.exit(1);
    }
  }
  if (!apiOk) process.exit(1);

  if (config.disableBeta) {
    try {
      await api.disableBeta();
      console.log('Beta mode disabled.');
    } catch (e) {
      console.warn('Could not disable beta:', (e as Error).message);
    }
  }

  if (config.reuploadProfilePhotos) {
    if (!config.citeAdminSecret && !config.citeAgentSecret) {
      console.error('CITE_ADMIN_SECRET or CITE_AGENT_SECRET required for --reupload-profile-photos.');
      process.exit(1);
    }
    await runReuploadProfilePhotos(config, api);
    return;
  }

  if (config.addPostTitleImages) {
    if (!config.citeAdminSecret && !config.citeAgentSecret) {
      console.error('CITE_ADMIN_SECRET or CITE_AGENT_SECRET required for --add-post-title-images.');
      process.exit(1);
    }
    await runAddPostTitleImages(config, api);
    return;
  }

  const imageConfig = {
    pixabayApiKey: config.pixabayApiKey,
    pexelsApiKey: config.pexelsApiKey,
  };

  if (config.resumeFromDb) {
    let list: { email: string; handle: string; displayName: string; bio: string }[];
    try {
      list = await api.listAgentUsers();
    } catch (e) {
      console.error('Failed to list agent users:', (e as Error).message);
      process.exit(1);
    }
    if (list.length === 0) {
      console.log('No agent users (@agents.local) in the API. Seed some with --seed-db first.');
      return;
    }
    const storedPersonas: StoredPersona[] = list.map((u) => ({
      characterType: 'knowledgeable',
      displayName: u.displayName,
      handle: u.handle,
      bio: u.bio,
      behavior: '',
      email: u.email,
      createdAt: new Date().toISOString(),
    }));
    const batchSize = config.resumeBatchSize;
    console.log(`Resuming ${storedPersonas.length} agent(s) from DB in batches of ${batchSize}...\n`);
    for (let offset = 0; offset < storedPersonas.length; offset += batchSize) {
      const chunk = storedPersonas.slice(offset, offset + batchSize);
      await Promise.all(
        chunk.map((stored, j) =>
          runResumedAgent(offset + j, storedPersonas.length, config, openai, gemini, api, stored),
        ),
      );
      if (offset + batchSize < storedPersonas.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    console.log('\nAll agents finished.');
    return;
  }

  if (config.resume) {
    const personas = await loadPersonas(config.personasFile);
    if (personas.length === 0) {
      console.log('No personas found in', config.personasFile, '— run without --resume and use --save first.');
      return;
    }
    const batchSize = config.resumeBatchSize;
    console.log(`Resuming ${personas.length} persona(s) in batches of ${batchSize}...\n`);
    for (let offset = 0; offset < personas.length; offset += batchSize) {
      const chunk = personas.slice(offset, offset + batchSize);
      await Promise.all(
        chunk.map((stored, j) =>
          runResumedAgent(offset + j, personas.length, config, openai, gemini, api, stored),
        ),
      );
      if (offset + batchSize < personas.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    console.log('\nAll resumed agents finished.');
    return;
  }

  // Fresh run: create personas sequentially (for handle uniqueness), then run all in parallel.
  const usedHandles = new Set<string>();
  const usedDisplayNames = new Set<string>();
  const agentsToRun: Array<{
    index: number;
    character: import('./characters.js').CharacterDef;
    persona: { displayName: string; handle: string; bio: string; behavior: string };
    email: string;
    topics?: string[];
  }> = [];

  for (let a = 0; a < config.agentsCount; a++) {
    if (config.realPersonas) {
      console.log(`Creating real social persona ${a + 1}/${config.agentsCount}...`);
      let result;
      try {
        result = await createRealSocialPersona(openai, gemini, model, usedHandles, { usedDisplayNames });
      } catch (e) {
        console.error('Real persona creation failed:', (e as Error).message);
        continue;
      }
      let handle = result.persona.handle;
      const available = await api.checkHandleAvailable(handle);
      if (!available?.available) {
        handle = result.persona.handle + '_' + randomId();
      }
      usedHandles.add(handle);
      usedDisplayNames.add(result.persona.displayName);
      const persona = { ...result.persona, handle };
      const email = `agent.${handle}.${randomId()}@agents.local`;
      agentsToRun.push({
        index: a,
        character: result.character,
        persona,
        email,
        topics: result.topics,
      });
    } else {
      const character = randomCharacter();
      console.log(`Creating persona ${a + 1}/${config.agentsCount}: ${character.label}`);

      let persona;
      try {
        persona = await createPersona(openai, gemini, model, character, usedHandles, { usedDisplayNames });
      } catch (e) {
        console.error('Persona creation failed:', (e as Error).message);
        continue;
      }

      let handle = persona.handle;
      const available = await api.checkHandleAvailable(handle);
      if (!available?.available) {
        handle = persona.handle + '_' + randomId();
      }
      usedHandles.add(handle);
      usedDisplayNames.add(persona.displayName);
      persona = { ...persona, handle };
      const email = `agent.${handle}.${randomId()}@agents.local`;
      agentsToRun.push({ index: a, character, persona, email });
    }
  }

  if (agentsToRun.length === 0) {
    console.log('No agents to run.');
    return;
  }

  const runBatchSize = config.runBatchSize;
  if (agentsToRun.length > runBatchSize) {
    console.log(`\nRunning ${agentsToRun.length} agent(s) in batches of ${runBatchSize} (avoids API overload).\n`);
  } else {
    console.log(`\nRunning ${agentsToRun.length} agent(s)...\n`);
  }

  const results: Array<{ stored: StoredPersona; actionsDone: number } | null> = [];

  for (let offset = 0; offset < agentsToRun.length; offset += runBatchSize) {
    const chunk = agentsToRun.slice(offset, offset + runBatchSize);
    const batchResults = await Promise.all(
      chunk.map(async ({ index, character, persona, email, topics }) => {
        let token: string;
        let storedEmail: string;
        if (config.citeAgentSecret) {
          try {
            const auth = await withRetry(() => api.authViaAgentApi(email), `[${index + 1}] Agent API Auth`);
            token = auth.accessToken;
            storedEmail = (auth.user as { email?: string }).email ?? email;
          } catch (e) {
            console.error(`[${index + 1}] Agent API Auth failed:`, (e as Error).message);
            return null;
          }
        } else if (config.seedDb) {
          try {
            const isProtected = Math.random() < config.privateRatio;
            const auth = await withRetry(
              () =>
                api.seedAgent({
                  handle: persona.handle,
                  displayName: persona.displayName,
                  bio: persona.bio,
                  isProtected,
                }),
              `[${index + 1}] Seed agent`,
            );
            token = auth.accessToken;
            storedEmail = (auth.user as { email?: string }).email ?? email;
          } catch (e) {
            console.error(`[${index + 1}] Seed agent failed:`, (e as Error).message);
            return null;
          }
        } else {
          try {
            const auth = await withRetry(
              () => devSignup(api, email, config.citeDevToken),
              `[${index + 1}] Signup`,
            );
            token = auth.accessToken;
            storedEmail = email;
          } catch (e) {
            console.error(`[${index + 1}] Signup failed:`, (e as Error).message);
            return null;
          }
        }

        const avatarQuery = character.avatarQuery ?? 'portrait';
        let avatarBuffer: Buffer | null = null;
        const avatarImg = await getAvatarImage(imageConfig, avatarQuery, { page: index + 1 });
        if (avatarImg) avatarBuffer = avatarImg.buffer;
        if (!avatarBuffer) avatarBuffer = await getPlaceholderAvatarImage(persona.handle);
        if (!avatarBuffer) {
          console.error(`[${index + 1}] No profile image available (upload or placeholder failed).`);
          return null;
        }
        let avatarKey: string | null = null;
        try {
          const up = await withRetry(
            () => api.uploadProfilePicture(token, avatarBuffer!, `avatar-${persona.handle}.jpg`),
            `[${index + 1}] Profile upload`,
          );
          avatarKey = up.key;
        } catch (e) {
          console.error(`[${index + 1}] Profile image upload failed:`, (e as Error).message);
          return null;
        }

        try {
          await withRetry(
            () =>
              api.updateMe(token, {
                ...(config.seedDb ? {} : { handle: persona.handle, displayName: persona.displayName, bio: persona.bio }),
                avatarKey,
              }),
            `[${index + 1}] Profile update`,
          );
        } catch (e) {
          console.error(`[${index + 1}] Profile update failed:`, (e as Error).message);
          return null;
        }

        console.log(`[${index + 1}/${agentsToRun.length}] ${persona.displayName} (@${persona.handle}) — ${config.actionsPerAgent} actions...`);
        let actionsDone = 0;
        try {
          actionsDone = await runAgentLoop({
            openai,
            gemini,
            model,
            api,
            ctx: {
              token,
              handle: persona.handle,
              displayName: persona.displayName,
              character,
              persona: {
                displayName: persona.displayName,
                handle: persona.handle,
                bio: persona.bio,
                behavior: persona.behavior,
              },
              imageConfig,
            },
            maxActions: config.actionsPerAgent,
            minPosts: config.minPostsPerAgent,
            version: config.version,
            onAction: () => process.stdout.write('.'),
          });
        } catch (e) {
          console.error(`[${index + 1}] Agent loop error:`, (e as Error).message);
        }
        console.log(` [${index + 1}/${agentsToRun.length}] Done. Actions: ${actionsDone}`);

        const storedPersona: StoredPersona = {
          characterType: character.type,
          displayName: persona.displayName,
          handle: persona.handle,
          bio: persona.bio,
          behavior: persona.behavior,
          email: storedEmail,
          createdAt: new Date().toISOString(),
        };
        if (topics?.length) storedPersona.topics = topics;
        return { stored: storedPersona, actionsDone };
      }),
    );
    results.push(...batchResults);

    // Save personas after each batch so progress isn't lost if the run is interrupted
    if (config.save) {
      const succeededSoFar = results.filter((r): r is NonNullable<typeof r> => r != null);
      if (succeededSoFar.length > 0) {
        const newPersonas = succeededSoFar.map((r) => r.stored);
        const existing = await loadPersonas(config.personasFile);
        const byHandle = new Map<string, StoredPersona>();
        for (const p of existing) byHandle.set(p.handle, p);
        for (const p of newPersonas) byHandle.set(p.handle, p);
        const merged = Array.from(byHandle.values());
        await savePersonas(config.personasFile, merged);
        const batchEnd = Math.min(offset + runBatchSize, agentsToRun.length);
        if (batchEnd < agentsToRun.length) {
          console.log(`\nSaved ${merged.length} persona(s) to ${config.personasFile} (${batchEnd}/${agentsToRun.length} agents done so far).`);
        }
      }
    }

    if (offset + runBatchSize < agentsToRun.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const succeeded = results.filter((r): r is NonNullable<typeof r> => r != null);
  if (config.save && succeeded.length > 0) {
    const newPersonas = succeeded.map((r) => r.stored);
    const existing = await loadPersonas(config.personasFile);
    const byHandle = new Map<string, StoredPersona>();
    for (const p of existing) byHandle.set(p.handle, p);
    for (const p of newPersonas) byHandle.set(p.handle, p);
    const merged = Array.from(byHandle.values());
    await savePersonas(config.personasFile, merged);
    console.log('\nSaved', merged.length, 'persona(s) to', config.personasFile, `(${newPersonas.length} new this run)`);
    console.log('Next time run: npm run run -- --resume --actions', config.actionsPerAgent);
  }

  console.log('\nAll agents finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
