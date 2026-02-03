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
import { createApiClient, devSignup } from './api-client.js';
import { getAvatarImage, getPlaceholderAvatarImage } from './image-provider.js';
import { randomCharacter, getCharacterByType } from './characters.js';
import { createPersona } from './persona.js';
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
  let privateRatio = parseFloat(env.CITE_AGENTS_PRIVATE_RATIO ?? '0.15');
  let useOllama = env.USE_OLLAMA === 'true' || env.USE_OLLAMA === '1';
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
    } else if (args[i] === '--private-ratio' && args[i + 1]) {
      privateRatio = Math.max(0, Math.min(1, parseFloat(args[i + 1])));
      i++;
    } else if (args[i] === '--personas-file' && args[i + 1]) {
      personasFile = args[i + 1];
      i++;
    } else if (args[i] === '--ollama') {
      useOllama = true;
    }
  }
  return {
    citeApiUrl: env.CITE_API_URL ?? 'http://localhost/api',
    citeAdminSecret: env.CITE_ADMIN_SECRET ?? 'dev-admin-change-me',
    citeDevToken: env.CITE_DEV_TOKEN ?? '123456',
    disableBeta: env.CITE_DISABLE_BETA === 'true' || env.CITE_DISABLE_BETA === '1',
    openaiApiKey: env.OPENAI_API_KEY ?? '',
    openaiModel: env.OPENAI_MODEL ?? 'gpt-4o-mini',
    useOllama,
    ollamaModel: env.OLLAMA_MODEL ?? 'granite4:latest',
    ollamaBaseUrl: (env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, ''),
    pixabayApiKey: env.PIXABAY_API_KEY,
    pexelsApiKey: env.PEXELS_API_KEY,
    agentsCount: Math.max(1, agentsCount),
    actionsPerAgent: Math.max(1, actionsPerAgent),
    save,
    resume,
    resumeFromDb,
    seedDb,
    resumeBatchSize: Math.max(1, resumeBatchSize),
    privateRatio,
    personasFile: personasFile ?? getPersonasFilePath(),
  };
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Run one agent from a stored persona (re-auth, then loop only). */
async function runResumedAgent(
  index: number,
  total: number,
  config: ReturnType<typeof getConfig>,
  openai: OpenAI,
  api: ReturnType<typeof createApiClient>,
  stored: StoredPersona,
): Promise<number> {
  const character = getCharacterByType(stored.characterType);
  if (!character) {
    console.warn(`[${index + 1}/${total}] Unknown characterType "${stored.characterType}", skipping.`);
    return 0;
  }

  let token: string;
  try {
    if (config.citeAdminSecret) {
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

  const model = config.useOllama ? config.ollamaModel : config.openaiModel;
  console.log(`[${index + 1}/${total}] Resumed ${stored.displayName} (@${stored.handle}) — ${config.actionsPerAgent} actions...`);
  let actionsDone = 0;
  try {
    actionsDone = await runAgentLoop({
      openai,
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
      },
      maxActions: config.actionsPerAgent,
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
  const model = config.useOllama ? config.ollamaModel : config.openaiModel;
  const provider = config.useOllama ? 'Ollama' : 'OpenAI';

  console.log('Cite Agents Runner');
  console.log('  API:', config.citeApiUrl);
  console.log(`  LLM: ${provider} (${model})`);
  console.log('  Actions per agent:', config.actionsPerAgent);
  if (config.resume) {
    console.log('  Mode: resume (load personas from file)');
    console.log('  Personas file:', config.personasFile);
  } else if (config.resumeFromDb) {
    console.log('  Mode: resume-from-db (list agent users from API, run loops)');
  } else {
    console.log('  Agents (parallel):', config.agentsCount);
    if (config.seedDb) {
      console.log('  Seed DB: yes (profiles written directly, Meilisearch + Neo4j)');
      if (config.privateRatio > 0) console.log('  Private profiles (isProtected):', Math.round(config.privateRatio * 100) + '%');
    }
    if (config.save) console.log('  Save personas: yes');
  }
  if (!config.useOllama && !config.openaiApiKey) {
    console.error('OPENAI_API_KEY is required (or use --ollama for local Ollama).');
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
    : new OpenAI({ apiKey: config.openaiApiKey });

  const api = createApiClient({
    baseUrl: config.citeApiUrl,
    adminKey: config.citeAdminSecret,
    devToken: config.citeDevToken,
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
        console.error('Set CITE_API_URL to the API base (e.g. http://localhost/api for Docker, http://localhost:3000 for local API), not the web app.');
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
          runResumedAgent(offset + j, storedPersonas.length, config, openai, api, stored),
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
          runResumedAgent(offset + j, personas.length, config, openai, api, stored),
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
  const agentsToRun: Array<{
    index: number;
    character: ReturnType<typeof randomCharacter>;
    persona: Awaited<ReturnType<typeof createPersona>> & { handle: string };
    email: string;
  }> = [];

  for (let a = 0; a < config.agentsCount; a++) {
    const character = randomCharacter();
    console.log(`Creating persona ${a + 1}/${config.agentsCount}: ${character.label}`);

    let persona;
    try {
      persona = await createPersona(openai, model, character, usedHandles);
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
    persona = { ...persona, handle };
    const email = `agent.${handle}.${randomId()}@agents.local`;
    agentsToRun.push({ index: a, character, persona, email });
  }

  if (agentsToRun.length === 0) {
    console.log('No agents to run.');
    return;
  }

  console.log(`\nRunning ${agentsToRun.length} agent(s) in parallel...\n`);

  const results = await Promise.all(
    agentsToRun.map(async ({ index, character, persona, email }) => {
      let token: string;
      let storedEmail: string;
      if (config.seedDb) {
        try {
          const isProtected = Math.random() < config.privateRatio;
          const auth = await api.seedAgent({
            handle: persona.handle,
            displayName: persona.displayName,
            bio: persona.bio,
            isProtected,
          });
          token = auth.accessToken;
          storedEmail = (auth.user as { email?: string }).email ?? email;
        } catch (e) {
          console.error(`[${index + 1}] Seed agent failed:`, (e as Error).message);
          return null;
        }
      } else {
        try {
          const auth = await devSignup(api, email, config.citeDevToken);
          token = auth.accessToken;
          storedEmail = email;
        } catch (e) {
          console.error(`[${index + 1}] Signup failed:`, (e as Error).message);
          return null;
        }
      }

      // Profile image is required: Pixabay/Pexels or placeholder (can be anything).
      let avatarKey: string | null = null;
      const avatarQuery = character.avatarQuery ?? 'portrait';
      try {
        let avatarBuffer: Buffer | null = null;
        const avatarImg = await getAvatarImage(imageConfig, avatarQuery);
        if (avatarImg) avatarBuffer = avatarImg.buffer;
        if (!avatarBuffer) avatarBuffer = await getPlaceholderAvatarImage(persona.handle);
        if (avatarBuffer) {
          const up = await api.uploadProfilePicture(
            token,
            avatarBuffer,
            `avatar-${persona.handle}.jpg`,
          );
          avatarKey = up.key;
        }
      } catch (e) {
        console.error(`[${index + 1}] Profile image upload failed:`, (e as Error).message);
        return null;
      }
      if (!avatarKey) {
        console.error(`[${index + 1}] No profile image available (upload or placeholder failed).`);
        return null;
      }

      try {
        await api.updateMe(token, {
          ...(config.seedDb ? {} : { handle: persona.handle, displayName: persona.displayName, bio: persona.bio }),
          avatarKey,
        });
      } catch (e) {
        console.error(`[${index + 1}] Profile update failed:`, (e as Error).message);
        return null;
      }

      console.log(`[${index + 1}/${agentsToRun.length}] ${persona.displayName} (@${persona.handle}) — ${config.actionsPerAgent} actions...`);
      let actionsDone = 0;
      try {
        actionsDone = await runAgentLoop({
          openai,
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
          },
          maxActions: config.actionsPerAgent,
          onAction: () => process.stdout.write('.'),
        });
      } catch (e) {
        console.error(`[${index + 1}] Agent loop error:`, (e as Error).message);
      }
      console.log(` [${index + 1}/${agentsToRun.length}] Done. Actions: ${actionsDone}`);

      return {
        stored: {
          characterType: character.type,
          displayName: persona.displayName,
          handle: persona.handle,
          bio: persona.bio,
          behavior: persona.behavior,
          email: storedEmail,
          createdAt: new Date().toISOString(),
        } satisfies StoredPersona,
        actionsDone,
      };
    }),
  );

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
