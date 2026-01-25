# CITE System - Complete Deployment Guide

## 🚀 Quick Start

### 1. Start Docker Services

```bash
./scripts/start-docker.sh
```

This will:
- Start all required services (PostgreSQL, Neo4j, Redis, Meilisearch, MinIO)
- Start API and Web services
- Wait for services to be healthy

### 2. Setup MinIO Bucket

```bash
./scripts/setup-minio.sh
```

This creates the `cite-images` bucket and sets it to public.

### 3. Run Database Migrations

```bash
cd apps/api
pnpm migration:run
```

### 4. Seed Database (Optional)

```bash
cd apps/api
pnpm seed
```

### 5. Test APIs

```bash
./scripts/test-apis.sh
```

## 📋 Service URLs

- **API**: http://localhost:3000
- **Web**: http://localhost:3001
- **Neo4j Browser**: http://localhost:7474
- **MinIO Console**: http://localhost:9001
- **Meilisearch**: http://localhost:7700

## 🔑 Default Credentials

- **PostgreSQL**: postgres/postgres
- **Neo4j**: neo4j/password
- **MinIO**: minioadmin/minioadmin
- **Meilisearch**: masterKey (master key)

## 📱 Mobile App

To run the mobile app:

```bash
cd apps/mobile
pnpm install
pnpm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

## 🧪 Testing

### Test All APIs

```bash
./scripts/test-apis.sh
```

### Test Individual Services

```bash
# Test API health
curl http://localhost:3000/health

# Test feed
curl -H "Authorization: Bearer $DEV_TOKEN" http://localhost:3000/feed

# Test search
curl -H "Authorization: Bearer $DEV_TOKEN" "http://localhost:3000/search/posts?q=test"
```

## 🐛 Troubleshooting

### Services not starting

```bash
# Check logs
docker compose logs [service-name]

# Restart services
docker compose restart [service-name]
```

### Database connection issues

```bash
# Check database is running
docker compose ps db

# Check connection
docker compose exec db psql -U postgres -c "SELECT 1"
```

### MinIO bucket not accessible

```bash
# Re-run setup
./scripts/setup-minio.sh
```

## 📊 Monitoring

### View all logs

```bash
docker compose logs -f
```

### View specific service logs

```bash
docker compose logs -f api
docker compose logs -f web
```

## 🛑 Stop Services

```bash
cd infra/docker
docker compose down
```

To remove volumes (⚠️ deletes data):

```bash
docker compose down -v
```

## ✅ Verification Checklist

- [ ] All Docker services are running (`docker compose ps`)
- [ ] API responds at http://localhost:3000/health
- [ ] Web app loads at http://localhost:3001
- [ ] MinIO bucket `cite-images` exists and is public
- [ ] Database migrations have run
- [ ] API tests pass (`./scripts/test-apis.sh`)
- [ ] Mobile app can connect to API

## 🎉 Success!

Your CITE system is now running locally! All features are available:
- ✅ Complete backend API
- ✅ Complete web frontend
- ✅ Complete mobile app
- ✅ All services configured
