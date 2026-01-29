# API Testing and Data Seeding - Complete Guide

## ✅ Status

### Migrations
- ✅ **Completed**: All database migrations have been run
- ✅ **Tables Created**: All entities are ready

### Data Seeding
- ✅ **Seeding Script**: `apps/api/src/seed-comprehensive.ts`
- ✅ **Fixed**: TypeORM delete issue resolved (using TRUNCATE)
- ⏳ **Running**: Seeding in progress (creates realistic test data)

## 📊 Test Data Generated

The comprehensive seeder creates:

### Users (50)
- Realistic names, handles, bios
- Various languages
- Invite codes

### Topics (20)
- Diverse topics (AI, sustainability, architecture, etc.)
- Topic follows

### Posts (200)
- Various types (regular, with titles, quotes)
- Realistic content
- Topics attached
- External sources
- Mentions

### Interactions
- **150 Replies** - Threaded conversations
- **300 Likes** - Private likes
- **250 Keeps** - Saved posts
- **Follows** - User-to-user follows
- **Topic Follows** - User-to-topic follows

### Collections (30)
- Public and private collections
- Collection items with notes
- Curator notes

### Beta Features
- **10 System Invites** - System-generated invite codes
- **User Invites** - User-generated invites
- **5 Waiting List Entries** - Beta waiting list
- **Beta Mode Enabled** - System setting

### Graph Data
- **Post Edges** - QUOTE, REPLY relationships
- **Neo4j** - Graph relationships for deep dives

## 🧪 Testing the API

### Quick Tests

```bash
# Health check
curl http://localhost:3000/health

# Suggested users
curl 'http://localhost:3000/users/suggested?limit=5'

# Explore topics
curl 'http://localhost:3000/explore/topics?page=1&limit=5'

# Explore quoted-now
curl 'http://localhost:3000/explore/quoted-now?page=1&limit=5'

# Explore deep-dives
curl 'http://localhost:3000/explore/deep-dives?page=1&limit=5'

# Explore newsroom
curl 'http://localhost:3000/explore/newsroom?page=1&limit=5'

# Search posts
curl 'http://localhost:3000/search/posts?q=AI'

# Search users
curl 'http://localhost:3000/search/users?q=alice'
```

### Comprehensive Testing

```bash
# Run all endpoint tests
export DEV_TOKEN="test-token"
./scripts/test-all-endpoints.sh

# Run production-grade tests (algorithms, beta features)
./scripts/test-production-grade.sh
```

## 📋 Seeding Commands

### Run Migrations

```bash
# From host
cd apps/api
DATABASE_URL="postgres://postgres:postgres@localhost:5433/postgres" pnpm migration:run

# From Docker
docker compose -f infra/docker/docker-compose.yml exec api pnpm migration:run
```

### Run Comprehensive Seeding

```bash
# From host (recommended - has all dependencies)
cd apps/api
DATABASE_URL="postgres://postgres:postgres@localhost:5433/postgres" \
NEO4J_URI="bolt://localhost:7687" \
NEO4J_USER="neo4j" \
NEO4J_PASSWORD="password" \
REDIS_URL="redis://localhost:6379" \
MEILISEARCH_HOST="http://localhost:7700" \
MEILISEARCH_MASTER_KEY="masterKey" \
MINIO_ENDPOINT="localhost" \
MINIO_PORT="9000" \
MINIO_USE_SSL="false" \
MINIO_ACCESS_KEY="minioadmin" \
MINIO_SECRET_KEY="minioadmin" \
MINIO_BUCKET="cite-images" \
MINIO_PUBLIC_URL="http://localhost:9000" \
JWT_SECRET="your-secret-key" \
OLLAMA_HOST="http://localhost:11434" \
pnpm seed:comprehensive
```

### From Docker (if dependencies are installed)

```bash
docker compose -f infra/docker/docker-compose.yml exec api pnpm seed:comprehensive
```

## 🔍 Verify Data

### Check Users

```bash
curl 'http://localhost:3000/users/suggested?limit=10' | python3 -m json.tool
```

### Check Posts

```bash
# Get a user first
USER_ID=$(curl -s 'http://localhost:3000/users/suggested?limit=1' | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")

# Get their posts
curl "http://localhost:3000/users/$USER_ID/posts?page=1&limit=5" | python3 -m json.tool
```

### Check Topics

```bash
curl 'http://localhost:3000/explore/topics?page=1&limit=10' | python3 -m json.tool
```

### Check Collections

```bash
# Get a user first
USER_ID=$(curl -s 'http://localhost:3000/users/suggested?limit=1' | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")

# Get their collections
curl "http://localhost:3000/users/$USER_ID/collections?page=1&limit=5" | python3 -m json.tool
```

## 🎯 Test Scenarios

### 1. Feed Algorithm
```bash
# Requires authentication - get token first
curl -X POST 'http://localhost:3000/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice_writer@example.com"}'

# Then use token for feed
curl 'http://localhost:3000/feed?page=1&limit=20' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 2. Explore Algorithms
```bash
# Quoted Now (quote velocity)
curl 'http://localhost:3000/explore/quoted-now?page=1&limit=10'

# Deep Dives (link chains)
curl 'http://localhost:3000/explore/deep-dives?page=1&limit=10'

# Newsroom (posts with sources)
curl 'http://localhost:3000/explore/newsroom?page=1&limit=10'

# People (AI recommendations)
curl 'http://localhost:3000/explore/people?page=1&limit=10'
```

### 3. Topic "Start Here"
```bash
# Get a topic slug
TOPIC_SLUG=$(curl -s 'http://localhost:3000/explore/topics?page=1&limit=1' | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['slug'])")

# Get start here posts
curl "http://localhost:3000/topics/$TOPIC_SLUG?sort=start-here" | python3 -m json.tool
```

### 4. Search
```bash
# Search posts
curl 'http://localhost:3000/search/posts?q=AI&limit=10'

# Search users
curl 'http://localhost:3000/search/users?q=alice&limit=10'
```

### 5. Beta Features
```bash
# Get system invites (requires admin or system token)
curl 'http://localhost:3000/invites/my'

# Generate invite
curl -X POST 'http://localhost:3000/invites/generate' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Check waiting list
curl 'http://localhost:3000/waiting-list'  # Admin only
```

## 📊 Expected Data Counts

After seeding completes:

- **Users**: 50
- **Topics**: 20
- **Posts**: 200
- **Replies**: 150
- **Likes**: 300
- **Keeps**: 250
- **Collections**: 30
- **Collection Items**: ~100
- **Follows**: ~100
- **Topic Follows**: ~50
- **Post Edges**: ~150 (QUOTE, REPLY)
- **External Sources**: ~50
- **Mentions**: ~30
- **Invites**: 10 system + user-generated
- **Waiting List**: 5 entries

## ✅ Verification Checklist

- [ ] Migrations run successfully
- [ ] Seeding completes without errors
- [ ] Users are created (check `/users/suggested`)
- [ ] Posts are created (check user posts)
- [ ] Topics are created (check `/explore/topics`)
- [ ] Collections are created (check user collections)
- [ ] Explore algorithms work (quoted-now, deep-dives, newsroom)
- [ ] Search works (posts, users)
- [ ] Beta features work (invites, waiting list)

## 🐛 Troubleshooting

### Seeding Fails

1. **Check database connection:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml exec db psql -U postgres -c "SELECT 1"
   ```

2. **Check Neo4j connection:**
   ```bash
   curl http://localhost:7474
   ```

3. **Check Redis:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml exec redis redis-cli ping
   ```

4. **Check Meilisearch:**
   ```bash
   curl http://localhost:7700/health
   ```

### API Returns Empty Results

- Seeding may still be running (takes 1-2 minutes)
- Wait for seeding to complete
- Check logs: `docker compose -f infra/docker/docker-compose.yml logs api`

### TypeORM Errors

- Ensure migrations are run first
- Check database connection
- Verify all environment variables are set

## 🎉 Success Indicators

When everything works:

1. ✅ Seeding completes with "✅ Seeding complete!"
2. ✅ API endpoints return data
3. ✅ Explore algorithms return results
4. ✅ Search finds posts/users
5. ✅ Collections have items
6. ✅ Topics have posts

**Your API is now populated with realistic test data and ready for testing!** 🚀
