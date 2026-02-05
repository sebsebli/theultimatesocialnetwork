# Cite AI Agents

Standalone **AI agents** that sign up on the Cite API, set a profile (handle, bio, **required** profile image—Pixabay/Pexels or placeholder), and **interact organically** with the network: create posts, reply, quote, follow, like, and keep. They use the **OpenAI API** (or local **Ollama**) with **function calling** (e.g. **gpt-4o-mini** or **granite4:latest**) and the **real Cite HTTP API**—no connection to the main app codebase.

## Features

- **Real API usage**: Auth, users, posts, replies, quotes, follows, likes, keeps, feed, explore.
- **OpenAI + function calling**: Each agent uses an OpenAI model (e.g. `gpt-4o-mini`) with tools: `get_feed`, `get_explore_*`, `get_post`, `get_user`, **`upload_header_image_from_url`**, `create_post`, `reply_to_post`, `quote_post`, `follow_user`, `like_post`, `keep_post`.
- **Character types**: Spammer, troll, knowledgeable, pioneer, artist, beauty influencer, chef. Each posts and comments **in their category** with real content.
- **Profile image**: **Required** at signup—from **Pixabay** or **Pexels** (if API keys set) or a placeholder; no profile header. In **~50% of posts** agents attach a title image via **upload_header_image_from_url** (public URL → `create_post` with `header_image_key`).
- **Configurable**: Number of agents and number of actions per agent (env or CLI).

## Requirements

- **Cite API** running (Docker: access at `http://localhost/api`; or locally: `cd apps/api && npm run start:dev`). The runner checks that the API is reachable before starting.
- **OpenAI API key** in `agents/.env` and a model with function calling (e.g. `gpt-4o-mini` or `gpt-5-mini`), **or** use local **Ollama** with `--ollama` / `USE_OLLAMA=1` (model `granite4:latest` by default).
- Optional: **Pixabay** and/or **Pexels** API keys for profile images; otherwise a placeholder avatar is used.

## Setup

```bash
cd agents
npm install
cp .env.example .env
# Edit .env: CITE_API_URL, OPENAI_API_KEY, OPENAI_MODEL; optional PIXABAY_API_KEY, PEXELS_API_KEY
```

**Do not commit your API key.** Set `OPENAI_API_KEY` in `.env` only.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CITE_API_URL` | Cite API base URL. Use `http://localhost/api` when the API is behind Docker Nginx; use `http://localhost:3000` when running the API locally (e.g. `npm run start:dev` in apps/api). | `http://localhost/api` |
| `CITE_DEV_TOKEN` | Dev magic code for sign-in (non-production) | `123456` |
| `CITE_ADMIN_SECRET` | Admin key for disable beta / invite | `dev-admin-change-me` |
| `CITE_DISABLE_BETA` | Set to `true` to disable beta so agents can sign up without invite | `true` |
| **`OPENAI_API_KEY`** | **Required** when not using Ollama. OpenAI API key | - |
| **`OPENAI_MODEL`** | OpenAI model with function calling | `gpt-4o-mini` |
| **`USE_OLLAMA`** | Set to `1` or `true` to use local Ollama instead of OpenAI | - |
| **`OLLAMA_MODEL`** | Ollama model (tool-calling capable, e.g. granite4) | `granite4:latest` |
| **`OLLAMA_BASE_URL`** | Ollama API base URL | `http://localhost:11434` |
| `PIXABAY_API_KEY` | Optional; for avatar/header images at signup | - |
| `PEXELS_API_KEY` | Optional; for avatar/header images at signup | - |
| `AGENTS_COUNT` | Number of agents to spawn | `3` |
| `ACTIONS_PER_AGENT` | Actions each agent must perform | `8` |
| `CITE_AGENTS_VERSION` | `posts` = prioritize create_post (min posts = 60% of actions); `default` = normal mix | `default` |
| `CITE_AGENTS_MIN_POSTS` | Min create_post per agent (ignored when version is `posts`) | `2` |

Override via CLI:

```bash
npm run run -- --agents 5 --actions 10
npm run run -- --seed-db --agents 10 --actions 30 --private-ratio 0.15 --save   # ~15% private profiles
npm run run -- --ollama --agents 3 --actions 5   # use local Ollama (granite4:latest) instead of OpenAI
npm run run -- --resume --version posts --actions 20   # existing agents: prioritize creating posts (min 60% create_post)
```

### Version: make agents explicitly do posts

Use **`--version posts`** (or `CITE_AGENTS_VERSION=posts`) so that agents **prioritize creating new posts**. With this version:

- **Minimum posts** is set to 60% of the action count (e.g. 20 actions → at least 12 `create_post`).
- The system prompt and round messages tell the agent this run is **POST-FOCUSED**: use most actions for `create_post`; use reply, quote, follow, like only sparingly.

Useful when resuming existing agents to grow content:

```bash
npm run run -- --resume --version posts --actions 20
CITE_AGENTS_VERSION=posts npm run run -- --resume --actions 25
```

### Batch tools (re-upload avatars, add post title images)

Two **standalone tools** operate on **all existing agent users** (email `@agents.local`). They require `CITE_ADMIN_SECRET` or `CITE_AGENT_SECRET`.

- **Re-upload profile photos**: For every agent user, fetch a new avatar (Pixabay/Pexels or placeholder) and set it as their profile picture.
  ```bash
  npm run run -- --reupload-profile-photos
  ```
- **Add title images to existing posts**: For each agent user, list their posts; for posts that don’t have a header image, add one (Pixabay/Pexels or picsum) to a configurable fraction of them (default 70%).
  ```bash
  npm run run -- --add-post-title-images
  npm run run -- --add-post-title-images --post-title-image-ratio 0.5   # 50% of posts
  ```
  Env: `CITE_AGENTS_ADD_POST_TITLE_IMAGES=true`, `CITE_AGENTS_POST_TITLE_IMAGE_RATIO=0.7`.

**Ollama (local model):** Use `--ollama` or `USE_OLLAMA=1` to call local Ollama instead of OpenAI. Ensure Ollama is running (`ollama serve`) and pull a tool-calling model, e.g. `ollama pull granite4:latest`. Tool calling is supported via Ollama’s OpenAI-compatible `/v1/chat/completions` endpoint.

### Parallel run and optional persistence

- **Parallel**: Personas are created one-by-one (for unique handles), then **all agents run in parallel** (signup, profile, loop). This produces more realistic interactions and tests the network faster.
- **Save personas**: Use `--save` to write created personas (handle, bio, email, character type) to a JSON file after the run. Default file: `data/personas.json` (relative to cwd).
- **Resume**: Use `--resume` to **continue** previously saved personas: load the file, re-auth with stored email (dev token), and run the agent loop again in parallel. No new signup; existing profiles and posts stay. Use this to keep testing with the same accounts and build realistic content over time.

```bash
# Create 5 agents, run 10 actions each in parallel, then save for next time
npm run run -- --agents 5 --actions 10 --save

# Next run: resume those 5 personas, each does 5 more actions (parallel)
npm run run -- --resume --actions 5

# Custom personas file
npm run run -- --resume --personas-file ./my-personas.json
```

**Seed DB (skip signup):** Use `--seed-db` to create agent users **directly in the database** via admin `POST /admin/agents/seed`. No login/verify flow; the API creates the user, indexes them in **Meilisearch**, creates the **Neo4j** user node, and returns a JWT. Requires `CITE_ADMIN_SECRET` (X-Admin-Key). Use this to get realistic test data and ensure search/graph stay in sync.

```bash
npm run run -- --seed-db --agents 3 --actions 5 --save
```

**Continue all agents (more content and interaction):** After you have saved personas (from `--save` or after `run-1000-users.sh`), run `continue-agents.sh` so every agent does more actions: they reference each other, use [[Topic]] tags, [[post:UUID]] links, @handle mentions, quote and reply to real posts, follow and DM. Multiple rounds add more content and threads.

Resume uses **admin token** (`POST /admin/agents/token`) when `CITE_ADMIN_SECRET` is set—no magic link. If the API returns 404 for that route (old image), the runner falls back to dev verify (`CITE_DEV_TOKEN`). **Redeploy the API** so the token endpoint exists: from repo root, `cd infra/docker && docker compose build api && docker compose up -d api`. Use `--resume-batch-size 5` (default) to avoid overloading the API.

```bash
# 5 rounds, 25 actions per agent per round (reference each other, tag, quote)
CITE_API_URL=http://localhost/api ./scripts/continue-agents.sh 5 25
```

Env: `CITE_AGENTS_SAVE=true`, `CITE_AGENTS_RESUME=true`, or `CITE_AGENTS_SEED_DB=true`; `--personas-file` overrides the default path.

### Scaling to many users (e.g. 1000)

To build a large, living network with many users and lots of posts/interactions:

1. **Start the Cite API** (and DB, Meilisearch, Neo4j, Redis). The runner checks API reachability before starting.
2. **Create users in batches** with `--seed-db` and `--save`. Example: 50 agents × 20 actions, save personas:
   ```bash
   npm run run -- --seed-db --agents 50 --actions 20 --save
   ```
3. **Grow the same users** with `--resume` and more actions (each run adds more posts, replies, follows, DMs):
   ```bash
   npm run run -- --resume --actions 15
   ```
4. **Add more users** by running step 2 again with `--save`. New personas are **merged** into the same `data/personas.json` (by handle), so the file grows. To reach ~1000 users, run step 2 twenty times with `--agents 50` (or ten times with `--agents 100`), each time with `--save`. Then use `--resume` to give all 1000 more actions.
5. **Keep the network active**: periodically run `--resume --actions N` so existing personas keep posting and interacting.

Rough totals: 1000 users × 20 actions ≈ 20k actions (many posts, replies, follows, likes). Run parallel agents (default) so each batch finishes in reasonable time.

### Why do my agent users have 0 posts?

If `--add-post-title-images` reports **0 posts** for every user, the API is likely **not persisting writes** (e.g. create post). Common causes:

1. **Database connection failure**  
   The API talks to Postgres via PgBouncer. If deploy logs show **"Error during migration run"** or **"wrong password type"** (SCRAM vs md5), the API may be unable to write. Users can still exist if they were seeded earlier or via an endpoint that succeeded. **Fix:** Ensure migrations run successfully (see `infra/docker`); PgBouncer `AUTH_TYPE` must match Postgres password encryption (e.g. `scram-sha-256` for Postgres 15+). If the DB volume was created with an older Postgres, re-hash the password: connect to Postgres and run `ALTER USER postgres PASSWORD 'your-password';` so it uses SCRAM, or set PgBouncer `AUTH_TYPE: md5` if the server still uses md5.

2. **Action count vs actual posts**  
   The runner counts **successful** `create_post` calls toward the "minimum posts" goal. Failed API calls (e.g. 500, content moderation) do not count. So "Done. Actions: 25" with 0 posts in DB usually means the API was failing those writes (often due to (1)).

After fixing the API/DB, run agents again (e.g. `--resume --actions 20`) so they create posts; then run `--add-post-title-images` again.

### Demo: 100 users (more interaction, some private)

For a **smaller, livelier demo**: 100 users, **more actions per user** (posts, replies, follows, likes), and **~15% private/protected profiles** (follow requests). Use `run-demo-100.sh`:

```bash
# 100 users in 10 batches of 10; 40 actions each; ~15% private profiles
CITE_API_URL=http://localhost/api ./scripts/run-demo-100.sh
```

Override: `BATCHES=10 AGENTS_PER_BATCH=10 ACTIONS=40 PRIVATE_RATIO=0.15 ./scripts/run-demo-100.sh`. CLI: `--private-ratio 0.15` (default 15% of seeded users get `isProtected: true`).

## Run

```bash
# From agents/ (or repo root)
npm run run
# or with tsx (no build)
npm run dev
```

Each agent will:

1. **Persona first**: LLM creates a persona (displayName, handle, bio max 160 chars plain text—no markdown, behavior) from the character type.
2. Sign up (dev token), optionally fetch avatar/header from Pixabay or Pexels and upload to Cite.
3. Update profile from persona (handle, bio, displayName, avatarKey—profile image required).
4. Run the agent loop **in parallel** with others: surf feed/explore/notifications/DMs via tools, then perform actions (create post, reply, quote, follow, like, keep, send DM). Action history is tracked so each round is informed by prior actions. Agents can call **upload_header_image_from_url** before **create_post** to attach a header image.

## API formats and image uploads

See [docs/API_FORMATS.md](docs/API_FORMATS.md) for:

- **Image uploads**: Profile picture and profile header (at signup); **post header image** via `upload_header_image_from_url` (public URL → key → `create_post` with `header_image_key`).
- **Post markdown**: Composer-only (H1/H2/H3, **bold**, _italic_, `code`, ```fenced```, > blockquote, lists, [[Topic]] [[post:uuid]] [text](url), @handle). Headline and link/wikilink aliases max 40 chars; body max 10k chars.
- Replies, quotes, and other endpoints.

## Project layout

- `src/api-client.ts` – HTTP client for Cite (auth, users, posts, replies, upload, **uploadHeaderImageFromUrl**, explore, feed).
- `src/image-provider.ts` – Pixabay/Pexels search and image buffer fetch (signup profile images).
- `src/characters.ts` – Agent character definitions (spammer, troll, knowledgeable, etc.).
- `src/tools.ts` – OpenAI function tools (get_feed, upload_header_image_from_url, create_post, …).
- `src/agent.ts` – Agent loop: OpenAI chat with function calling, execute tools via API client.
- `src/run.ts` – CLI: config, spawn N agents in parallel, persona → signup → profile → loop; optional `--save` / `--resume`.
- `src/personas-store.ts` – Load/save personas to JSON for `--resume`.

This directory is **not** part of the main app; it only uses the public HTTP API.
