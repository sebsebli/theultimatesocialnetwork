# CITE - Text-First Social Network

A production-ready fullstack social network that merges social posting with Wikipedia-style inline links and citation-based recognition.

## Features

- **Text-first posting** with markdown support
- **Wikipedia-style links** - `[[Topic]]` and `[[post:uuid]]` syntax
- **Citation-based recognition** - Quotes are public, likes are private
- **Chronological home feed** - Follow-only, no algorithmic manipulation
- **Transparent Explore** - User-controlled relevance system
- **Collections** - Curated reposts with notes
- **Reading Mode** - Optimized typography for long-form content
- **Multi-language support** - Language detection and filtering

## Tech Stack

- **Web**: Next.js 15 + TypeScript
- **Mobile**: Expo React Native (latest) + TypeScript
- **API**: NestJS + TypeScript
- **Database**: PostgreSQL (Supabase self-host)
- **Graph DB**: Neo4j Community
- **Search**: Meilisearch
- **Cache/Queue**: Redis
- **Storage**: MinIO
- **Reverse Proxy**: Caddy

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- pnpm (or npm)

### Local Development

1. **Start infrastructure services:**

```bash
cd infra/docker
cp .env.example .env  # Edit if needed
docker compose up -d
```

This starts:
- PostgreSQL (port 5433)
- Neo4j (ports 7474, 7687)
- Redis (port 6379)
- Meilisearch (port 7700)
- MinIO (ports 9000, 9001)

2. **Install dependencies:**

```bash
pnpm install
```

3. **Start API:**

```bash
cd apps/api
pnpm dev
```

4. **Start Web:**

```bash
cd apps/web
pnpm dev
```

5. **Start Mobile (optional):**

```bash
cd apps/mobile
npx expo start
```

### Environment Variables

Create `.env` files as needed:

**API** (`apps/api/.env`):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REDIS_URL=redis://localhost:6379
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey
SUPABASE_JWT_SECRET=your-secret-here
```

**Web** (`apps/web/.env.local`):
```
API_URL=http://localhost:3000
DEV_TOKEN=your-dev-token
```

## Project Structure

```
cite-system/
├── apps/
│   ├── api/          # NestJS API
│   ├── web/          # Next.js web app
│   └── mobile/       # Expo React Native app
├── packages/
│   └── shared/       # Shared TypeScript types
├── infra/
│   └── docker/       # Docker Compose configuration
└── GEMINI.md         # Complete specification
```

## Key Endpoints

- `POST /posts` - Create post
- `GET /posts/:id` - Get post
- `POST /posts/:id/like` - Like post (private)
- `POST /posts/:id/quote` - Quote post
- `POST /posts/:id/keep` - Keep post
- `GET /feed` - Home timeline
- `GET /explore/quoted-now` - Trending quotes
- `GET /topics/:slug` - Topic page
- `GET /users/:handle` - User profile
- `GET /search/posts?q=query` - Search posts

## Design System

- **Colors**: Ink (#0B0B0C), Paper (#F2F2F2), Primary (#6E7A8A)
- **Typography**: Inter font family
- **Spacing**: 8px base unit

## Development

### Database Migrations

TypeORM handles migrations. Run:

```bash
cd apps/api
pnpm typeorm migration:run
```

### Testing

```bash
# API tests
cd apps/api
pnpm test

# Web tests
cd apps/web
pnpm test
```

## Deployment

### Hetzner (EU-only)

1. Provision VM in Germany or Finland (Falkenstein/Nuremberg/Helsinki)
2. Install Docker & Docker Compose
3. Clone repo and configure `.env`
4. Run `docker compose up -d`
5. Configure Caddy for TLS
6. Set up backups (Postgres, Neo4j, MinIO)

## License

[Your License Here]

## Contributing

[Contributing Guidelines]
