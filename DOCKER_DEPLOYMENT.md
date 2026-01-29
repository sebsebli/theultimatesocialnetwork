# Docker Deployment Guide

This guide explains how to deploy the CITE system using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB+ disk space

## Quick Start

### 1. Configure Environment Variables

```bash
cd infra/docker
cp .env.example .env
# Edit .env with your production values
```

### 2. Start All Services

```bash
# Development/Testing
docker compose -f docker-compose.yml up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Verify Services

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Check health
curl http://localhost/health
```

## Services

The Docker Compose setup includes:

### Core Services
- **PostgreSQL** (port 5433): Main database
- **Neo4j** (ports 7474, 7687): Graph database
- **Redis** (port 6379): Caching and rate limiting
- **Meilisearch** (port 7700): Search engine
- **MinIO** (ports 9000, 9001): Object storage
- **Ollama** (port 11434): AI model server

### Application Services
- **API** (port 3000): NestJS backend
- **Web** (port 3001): Next.js frontend
- **Nginx** (ports 80, 443): Reverse proxy

## Building Images

### Build All Services

```bash
cd infra/docker
docker compose build
```

### Build Individual Services

```bash
# API only
docker compose build api

# Web only
docker compose build web
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

### Database
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `NEO4J_PASSWORD`: Neo4j password

### Services
- `MEILI_MASTER_KEY`: Meilisearch master key
- `MINIO_ROOT_USER`: MinIO admin user
- `MINIO_ROOT_PASSWORD`: MinIO admin password

### Application
- `JWT_SECRET`: JWT secret for authentication
- `FRONTEND_URL`: Frontend URL for CORS
- `NEXT_PUBLIC_API_URL`: Public API URL
- `SMTP_*`: Email configuration

## Volumes

Data is persisted in `infra/docker/volumes/`:
- `volumes/db/`: PostgreSQL data
- `volumes/neo4j/`: Neo4j data and logs
- `volumes/redis/`: Redis data
- `volumes/meilisearch/`: Meilisearch index
- `volumes/minio/`: MinIO object storage
- `volumes/ollama/`: Ollama models
- `volumes/backups/`: Database backups

## Database Backups

Automatic backups run every 6 hours and are kept for 7 days by default.

Backups are stored in `volumes/backups/`.

To restore a backup:
```bash
docker compose exec db psql -U postgres -d postgres < backup_file.sql
```

## Production Deployment

### 1. Use Production Compose Override

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Configure SSL/TLS

1. Place SSL certificates in `infra/docker/ssl/`
2. Update `nginx-ssl.conf` with your domain
3. Use the SSL nginx configuration

### 3. Set Strong Passwords

Update `.env` with strong, unique passwords for:
- `POSTGRES_PASSWORD`
- `NEO4J_PASSWORD`
- `MEILI_MASTER_KEY`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`

### 4. Configure Firewall

Only expose necessary ports:
- 80 (HTTP)
- 443 (HTTPS)
- Consider closing other ports or using a firewall

## Monitoring

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
```

### Health Checks

All services include health checks. Check status:
```bash
docker compose ps
```

### Metrics

- API Prometheus metrics: `http://localhost:3000/metrics`
- Health endpoint: `http://localhost/health`

## Troubleshooting

### Cannot Reach http://localhost

If `http://localhost` or `http://localhost/health` does not respond:

1. **Confirm Docker is running** and the stack is up:
   ```bash
   cd infra/docker
   docker compose ps -a
   ```
   All app services (nginx, web, api) should be "Up" and (if healthchecks exist) "healthy".

2. **Capture logs** to see why nginx or backends failed:
   ```bash
   cd infra/docker
   ./check-logs.sh
   ```
   Or manually:
   ```bash
   docker compose logs nginx
   docker compose logs web
   docker compose logs api
   ```

3. **Common causes:**
   - **Port 80 in use:** Another process is bound to 80. Stop it or change nginx port in `docker-compose.yml` (e.g. `"8080:80"`).
   - **Nginx not started yet:** Nginx waits for API and web to be healthy. If API or web never become healthy, nginx will not start. Check `docker compose logs api` and `docker compose logs web` for errors.
   - **Build failures:** API or web image build may have failed. Run `docker compose build --no-cache api web` and fix any build errors.
   - **Missing .env:** Copy `cp .env.example .env` and adjust if required.
   - **ssl volume:** The `./ssl` directory must exist (or be created by Docker). An empty `infra/docker/ssl` is enough.

4. **Restart and re-check:**
   ```bash
   docker compose down
   docker compose up -d
   sleep 60
   ./check-logs.sh
   curl -v http://localhost/health
   ```

### Services Won't Start

1. Check logs: `docker compose logs`
2. Verify environment variables in `.env`
3. Ensure ports are not in use
4. Check disk space: `df -h`

### Database Connection Issues

1. Verify database is healthy: `docker compose ps db`
2. Check connection string in API logs
3. Ensure database has finished initializing

### Build Failures

1. Clear Docker cache: `docker compose build --no-cache`
2. Check Dockerfile syntax
3. Verify all required files are present

### Out of Memory

1. Increase Docker memory limit
2. Reduce service replicas
3. Consider removing unused services

## Updating Services

### Update Application Code

```bash
# Rebuild and restart
docker compose build api web
docker compose up -d api web
```

### Update Dependencies

1. Update `package.json` files
2. Rebuild images: `docker compose build`
3. Restart services: `docker compose up -d`

## Scaling

To scale services horizontally:

```bash
# Scale API instances
docker compose up -d --scale api=3

# Scale web instances
docker compose up -d --scale web=2
```

Note: Ensure your load balancer (Nginx) is configured for multiple instances.

## Cleanup

### Stop All Services

```bash
docker compose down
```

### Remove Volumes (⚠️ Deletes Data)

```bash
docker compose down -v
```

### Remove Images

```bash
docker compose down --rmi all
```

## Maintenance

### Database Migrations

```bash
# Run migrations
docker compose exec api npm run migration:run

# Generate migration
docker compose exec api npm run migration:generate -- -n MigrationName
```

### Seed Database

```bash
docker compose exec api npm run seed
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** - Generate secure random passwords
3. **Enable SSL/TLS** - Use HTTPS in production
4. **Limit network exposure** - Only expose necessary ports
5. **Regular updates** - Keep Docker images updated
6. **Backup regularly** - Test backup restoration
7. **Monitor logs** - Set up log aggregation
8. **Use secrets management** - Consider Docker secrets or external secret managers

## Support

For issues or questions:
1. Check logs: `docker compose logs`
2. Review this documentation
3. Check service health: `docker compose ps`
4. Verify environment configuration
