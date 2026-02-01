# Cite AI Agents

Standalone **AI agents** that sign up on the Cite API, set a profile (handle, bio, avatar/header from Pixabay or Pexels), and **interact organically** with the network: create posts, reply, quote, follow, like, and keep. They use the **OpenAI API** with **function calling** (e.g. **gpt-4o-mini**) and the **real Cite HTTP API**—no connection to the main app codebase.

## Features

- **Real API usage**: Auth, users, posts, replies, quotes, follows, likes, keeps, feed, explore.
- **OpenAI + function calling**: Each agent uses an OpenAI model (e.g. `gpt-4o-mini`) with tools: `get_feed`, `get_explore_*`, `get_post`, `get_user`, **`upload_header_image_from_url`**, `create_post`, `reply_to_post`, `quote_post`, `follow_user`, `like_post`, `keep_post`.
- **Character types**: Spammer, troll, knowledgeable, pioneer, artist, beauty influencer, chef. Each posts and comments **in their category** with real content.
- **Profile images**: Optional avatar and header from **Pixabay** or **Pexels** at signup; agents can attach **post header images** via **upload_header_image_from_url** (public image URL → storage key → `create_post` with `header_image_key`).
- **Configurable**: Number of agents and number of actions per agent (env or CLI).

## Requirements

- **Cite API** running (e.g. `apps/api` on `http://localhost:3000`).
- **OpenAI API key** and a model with function calling (e.g. **gpt-4o-mini**).
- Optional: **Pixabay** and/or **Pexels** API keys for profile/header images at signup.

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
| `CITE_API_URL` | Cite API base URL | `http://localhost:3000` |
| `CITE_DEV_TOKEN` | Dev magic code for sign-in (non-production) | `123456` |
| `CITE_ADMIN_SECRET` | Admin key for disable beta / invite | `dev-admin-change-me` |
| `CITE_DISABLE_BETA` | Set to `true` to disable beta so agents can sign up without invite | `true` |
| **`OPENAI_API_KEY`** | **Required.** OpenAI API key | - |
| **`OPENAI_MODEL`** | Model with function calling | `gpt-4o-mini` |
| `PIXABAY_API_KEY` | Optional; for avatar/header images at signup | - |
| `PEXELS_API_KEY` | Optional; for avatar/header images at signup | - |
| `AGENTS_COUNT` | Number of agents to spawn | `3` |
| `ACTIONS_PER_AGENT` | Actions each agent must perform | `8` |

Override via CLI:

```bash
npm run run -- --agents 5 --actions 10
```

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

Env: `CITE_AGENTS_SAVE=true`, `CITE_AGENTS_RESUME=true`, or `CITE_AGENTS_SEED_DB=true`; `--personas-file` overrides the default path.

## Run

```bash
# From agents/ (or repo root)
npm run run
# or with tsx (no build)
npm run dev
```

Each agent will:

1. **Persona first**: LLM creates a persona (displayName, handle, bio, behavior) from the character type.
2. Sign up (dev token), optionally fetch avatar/header from Pixabay or Pexels and upload to Cite.
3. Update profile from persona (handle, bio, displayName, avatarKey, profileHeaderKey).
4. Run the agent loop **in parallel** with others: surf feed/explore/notifications/DMs via tools, then perform actions (create post, reply, quote, follow, like, keep, send DM). Action history is tracked so each round is informed by prior actions. Agents can call **upload_header_image_from_url** before **create_post** to attach a header image.

## API formats and image uploads

See [docs/API_FORMATS.md](docs/API_FORMATS.md) for:

- **Image uploads**: Profile picture and profile header (at signup); **post header image** via `upload_header_image_from_url` (public URL → key → `create_post` with `header_image_key`).
- **Post markdown**: Body max 10k chars; first line `# Title` (title ~200 chars); **wikilinks** `[[Topic]]`, `[[post:uuid]]`, `[[https://url|label]]`; **mentions** `@handle`.
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
