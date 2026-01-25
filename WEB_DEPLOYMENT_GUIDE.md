# Web App Deployment Guide

## 🚀 Quick Start

### Development (Local)

```bash
cd apps/web
pnpm install
pnpm dev
```

Web app runs on http://localhost:3001

### Docker Development

```bash
# Start all services including web
docker compose -f infra/docker/docker-compose.yml up -d

# Check web logs
docker compose -f infra/docker/docker-compose.yml logs -f web

# Rebuild web if needed
docker compose -f infra/docker/docker-compose.yml build web
docker compose -f infra/docker/docker-compose.yml up -d web
```

### Production with Nginx

```bash
# Build and start all services
docker compose -f infra/docker/docker-compose.yml up -d --build

# Access via nginx (port 80)
# API: http://localhost/api
# Web: http://localhost
```

## 🔧 Troubleshooting

### Web App Won't Start

1. **Check if web service is running:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml ps web
   ```

2. **Check web logs:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml logs web --tail 100
   ```

3. **Common issues:**
   - **Build fails**: Check if `pnpm install` works locally
   - **Port conflict**: Make sure port 3001 is not in use
   - **API not reachable**: Check if API service is healthy
   - **Missing dependencies**: Rebuild the Docker image

4. **Rebuild from scratch:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml build --no-cache web
   docker compose -f infra/docker/docker-compose.yml up -d web
   ```

### Next.js Build Issues

1. **Standalone output not working:**
   - Check `next.config.mjs` has `output: 'standalone'`
   - Ensure all dependencies are in `package.json`

2. **Environment variables:**
   - Set `NEXT_PUBLIC_API_URL` in docker-compose.yml
   - Rebuild after changing env vars

3. **Image optimization:**
   - Check `next.config.mjs` remotePatterns
   - Ensure MinIO is accessible

## 📋 Production Setup

### With Nginx (Recommended)

1. **Start all services:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml up -d --build
   ```

2. **Access:**
   - Web: http://localhost (via nginx)
   - API: http://localhost/api (via nginx)
   - Direct API: http://localhost:3000
   - Direct Web: http://localhost:3001

3. **SSL Setup (Production):**
   ```bash
   # Place SSL certificates in infra/docker/ssl/
   # - cert.pem
   # - key.pem
   
   # Use SSL nginx config
   cp infra/docker/nginx-ssl.conf infra/docker/nginx.conf
   
   # Restart nginx
   docker compose -f infra/docker/docker-compose.yml restart nginx
   ```

### Without Nginx (Direct Access)

```bash
# Start services (web exposed on port 3001)
docker compose -f infra/docker/docker-compose.yml up -d

# Access:
# - Web: http://localhost:3001
# - API: http://localhost:3000
```

## 🏗️ Architecture

### Development
```
Browser → http://localhost:3001 → Next.js Dev Server
```

### Production (Docker)
```
Browser → http://localhost → Nginx → Web Container (Next.js)
Browser → http://localhost/api → Nginx → API Container
```

### Production (Direct)
```
Browser → http://localhost:3001 → Web Container (Next.js)
Browser → http://localhost:3000 → API Container
```

## 🔒 Security Features

### Nginx Provides:
- Rate limiting (100 req/min for API, 200 req/min for web)
- Security headers (HSTS, XSS protection, etc.)
- SSL/TLS termination
- Request size limits
- Timeout handling

### Next.js Provides:
- Security headers
- Image optimization
- Static file serving
- API route protection

## 📊 Monitoring

### Health Checks

```bash
# Web health
curl http://localhost:3001/api/health

# Via nginx
curl http://localhost/health
```

### Logs

```bash
# Web logs
docker compose -f infra/docker/docker-compose.yml logs -f web

# Nginx logs
docker compose -f infra/docker/docker-compose.yml logs -f nginx

# All logs
docker compose -f infra/docker/docker-compose.yml logs -f
```

## 🚀 Deployment Script

Use the deployment script:

```bash
./scripts/deploy-web.sh
```

This script:
1. Installs dependencies
2. Builds the Next.js app
3. Builds Docker image
4. Starts the service
5. Waits for health check

## ✅ Verification

After deployment, verify:

1. **Web app loads:**
   ```bash
   curl http://localhost:3001
   # or via nginx
   curl http://localhost
   ```

2. **API accessible:**
   ```bash
   curl http://localhost:3000/health
   # or via nginx
   curl http://localhost/api/health
   ```

3. **Check services:**
   ```bash
   docker compose -f infra/docker/docker-compose.yml ps
   ```

All services should show "Up" or "healthy" status.
