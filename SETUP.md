# CITE System Setup Guide

## Complete Feature Implementation Status

All features from GEMINI.md have been implemented and styled to match the design specifications.

## Quick Start

### 1. Infrastructure Setup

```bash
cd infra/docker
docker compose up -d
```

This starts all required services:
- PostgreSQL (port 5433)
- Neo4j (ports 7474, 7687)
- Redis (port 6379)
- Meilisearch (port 7700)
- MinIO (ports 9000, 9001)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

Run migrations (if using TypeORM migrations) or ensure schema is created.

### 4. Start Development Servers

**API:**
```bash
cd apps/api
pnpm dev
```

**Web:**
```bash
cd apps/web
pnpm dev
```

**Mobile:**
```bash
cd apps/mobile
npx expo start
```

## Implemented Features

### ✅ Web Application
- Welcome & Sign-in screens
- Onboarding flow (Profile, Languages, Starter packs)
- Home timeline with post rendering
- Compose editor with full toolbar
- Post detail page
- Reading Mode (article view)
- Explore page with tabs
- Topic pages
- Profile pages
- Collections
- Inbox (Notifications & Messages)
- Settings page
- Search functionality
- Quote composer

### ✅ Mobile Application
- Home screen
- Explore screen
- Compose screen
- Profile screen
- Push notification setup
- Design system implementation

### ✅ Backend API
- Posts CRUD with language detection
- Feed service (chronological)
- Explore service with algorithms:
  - Quote velocity ("Quoted now")
  - Topic "Start here" ranking
  - People recommendations
- Search with Meilisearch integration
- Interactions (Like, Keep, Quote)
- Collections management
- Topics management
- Users & Profiles
- Notifications
- Push tokens

### ✅ Infrastructure
- Docker Compose setup
- Neo4j graph database
- Meilisearch search engine
- Redis cache/queue
- MinIO object storage

## API Endpoints

### Posts
- `POST /posts` - Create post
- `GET /posts/:id` - Get post
- `DELETE /posts/:id` - Soft delete post
- `POST /posts/:id/like` - Toggle like
- `POST /posts/:id/keep` - Toggle keep
- `POST /posts/:id/quote` - Quote post

### Feed
- `GET /feed` - Home timeline

### Explore
- `GET /explore/topics` - List topics
- `GET /explore/people` - People recommendations
- `GET /explore/quoted-now` - Trending quotes

### Search
- `GET /search/posts?q=query` - Search posts

### Topics
- `GET /topics/:slug` - Get topic with posts

### Users
- `GET /users/:handle` - Get user profile

### Collections
- `POST /collections` - Create collection
- `GET /collections` - List collections
- `POST /collections/:id/items` - Add item

## Design System

All components follow the design specifications:

- **Colors**: 
  - Ink: `#0B0B0C`
  - Paper: `#F2F2F2`
  - Primary: `#6E7A8A`
  - Secondary: `#A8A8AA`
  - Tertiary: `#6E6E73`

- **Typography**: Inter font family
- **Spacing**: 8px base unit
- **Components**: Styled to match stitch_welcome_to_cite designs

## Next Steps

1. **Replace heuristic language detection** with CLD3 or fastText
2. **Implement BullMQ worker** for async Neo4j updates
3. **Add image upload** for header photos
4. **Complete push notification worker** (APNs/FCM)
5. **Add deep dive path generation** in Neo4j
6. **Implement user language preferences** filtering

## Environment Variables

See `.env.example` files in each app directory for required variables.
