# Production Deployment Guide

This guide covers deploying the CITE backend to Docker with comprehensive test data and full endpoint testing.

## Prerequisites

- Docker & Docker Compose installed
- At least 4GB RAM available
- Ports 3000, 3001, 5433, 7474, 7687, 6379, 7700, 9000, 9001 available

## Quick Start

### 1. Automated Deployment

Run the deployment script which handles everything:

```bash
./scripts/deploy-production.sh
```

This script will:
- Build and start all Docker services
- Wait for services to be healthy
- Run database migrations
- Seed comprehensive test data (50 users, 200 posts, realistic connections)
- Run comprehensive API tests

### 2. Manual Deployment

If you prefer manual control:

```bash
# Navigate to docker directory
cd infra/docker

# Build and start services
docker compose build
docker compose up -d

# Wait for services to be ready (check health)
curl http://localhost:3000/health

# Run migrations
docker compose exec api pnpm migration:run

# Seed test data
docker compose exec api pnpm seed:comprehensive

# Run tests
cd ../..
./scripts/test-all-endpoints.sh
```

## Test Data

The comprehensive seeder creates:

- **50 Users** with realistic profiles, handles, and bios
- **20 Topics** covering technology, science, philosophy, design, etc.
- **200 Posts** with titles, markdown content, topics, and realistic timestamps
- **Follow Relationships** - Each user follows 5-15 other users
- **Topic Follows** - Each user follows 2-6 topics
- **Post Edges** - Links and quotes between posts (30% link, 15% quote)
- **150 Replies** to posts with realistic content
- **300 Likes** distributed across posts
- **250 Keeps** (saved posts)
- **30 Collections** with 3-10 items each
- **Mentions** - 20% of posts mention other users
- **External Sources** - 30% of posts have external citations

## Testing

### Comprehensive Endpoint Testing

The test script (`scripts/test-all-endpoints.sh`) tests:

1. **Health & Infrastructure** - Health checks, root endpoint
2. **Authentication** - Login, token verification
3. **Users** - Profile, updates, suggestions
4. **Posts** - CRUD, sources, referenced-by, interactions
5. **Feed** - Home timeline with pagination
6. **Explore** - Topics, people, quoted-now, deep-dives, newsroom
7. **Topics** - Get topic, follow/unfollow
8. **Search** - Posts and users search
9. **Collections** - CRUD, add items
10. **Replies** - Create and list replies
11. **Keeps** - List keeps with filters
12. **Follows** - Follow/unfollow users
13. **Messages** - Message threads
14. **Notifications** - List and mark as read
15. **Safety** - Block, mute, report functionality
16. **Upload** - Header image upload (requires file)

### Running Tests

```bash
# Test all endpoints
./scripts/test-all-endpoints.sh

# Test with custom API URL
API_URL=http://localhost:3000 ./scripts/test-all-endpoints.sh

# Test with authentication token
DEV_TOKEN=your-token ./scripts/test-all-endpoints.sh
```

## Service URLs

Once deployed, services are available at:

- **API**: http://localhost:3000
- **Web**: http://localhost:3001
- **PostgreSQL**: localhost:5433
- **Neo4j Browser**: http://localhost:7474
- **Redis**: localhost:6379
- **Meilisearch**: http://localhost:7700
- **MinIO API**: http://localhost:9000
- **MinIO Console**: http://localhost:9001

## Production Configuration

### Environment Variables

Key environment variables for production:

```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Neo4j
NEO4J_URI=bolt://host:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secure-password

# Redis
REDIS_URL=redis://host:6379

# Meilisearch
MEILISEARCH_HOST=http://host:7700
MEILISEARCH_MASTER_KEY=secure-master-key

# MinIO
MINIO_ENDPOINT=host
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=access-key
MINIO_SECRET_KEY=secret-key
MINIO_BUCKET=cite-images
MINIO_PUBLIC_URL=https://cdn.example.com

# Security
SUPABASE_JWT_SECRET=your-secret-key
NODE_ENV=production
CORS_ORIGINS=https://app.example.com,https://www.example.com
```

### Docker Compose Production

The `docker-compose.yml` includes:

- **Health checks** for all services
- **Restart policies** (unless-stopped)
- **Multi-stage Docker builds** for optimized images
- **Non-root user** in production containers
- **Resource limits** (can be added)

### Security Features

- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 req/min)
- ✅ CORS configuration
- ✅ Input validation
- ✅ XSS protection (DOMPurify)
- ✅ SQL injection protection (TypeORM)
- ✅ Error handling (no stack traces in production)
- ✅ Structured logging

### Monitoring

Check service health:

```bash
# All services
docker compose ps

# API health
curl http://localhost:3000/health

# View logs
docker compose logs -f api
docker compose logs -f db
docker compose logs -f neo4j
```

## Maintenance

### Database Backups

```bash
# Backup PostgreSQL
docker compose exec db pg_dump -U postgres postgres > backup.sql

# Backup Neo4j (requires neo4j-admin)
docker compose exec neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j.dump
```

### Updating Services

```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up -d --build

# Run migrations
docker compose exec api pnpm migration:run
```

### Clearing Test Data

```bash
# Stop services
docker compose down

# Remove volumes (WARNING: deletes all data)
docker compose down -v

# Restart and reseed
docker compose up -d
docker compose exec api pnpm seed:comprehensive
```

## Troubleshooting

### API not starting

```bash
# Check logs
docker compose logs api

# Check database connection
docker compose exec api pnpm migration:run

# Verify environment variables
docker compose exec api env | grep DATABASE
```

### Services not healthy

```bash
# Check all service status
docker compose ps

# Check individual service logs
docker compose logs db
docker compose logs redis
docker compose logs neo4j
```

### Test failures

```bash
# Verify API is running
curl http://localhost:3000/health

# Check if data is seeded
curl http://localhost:3000/users/suggested

# Run tests with verbose output
API_URL=http://localhost:3000 ./scripts/test-all-endpoints.sh
```

## Performance

### Expected Performance

With seeded data (50 users, 200 posts):
- API response time: < 200ms for most endpoints
- Feed loading: < 500ms
- Search: < 300ms
- Database queries: Optimized with indexes

### Optimization Tips

1. **Database Indexes** - Already configured on frequently queried fields
2. **Redis Caching** - Used for sessions and frequently accessed data
3. **Connection Pooling** - TypeORM handles connection pooling
4. **Query Optimization** - Use pagination for large datasets

## Next Steps

1. **Set up monitoring** - Prometheus + Grafana (optional)
2. **Configure backups** - Automated database backups
3. **Set up SSL/TLS** - Use Caddy or nginx reverse proxy
4. **Configure CDN** - For MinIO public URLs
5. **Set up CI/CD** - Automated testing and deployment

## Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Review test output: `./scripts/test-all-endpoints.sh`
- Check service health: `docker compose ps`
