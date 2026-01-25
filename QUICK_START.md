# 🚀 CITE System - Quick Start Guide

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ and pnpm
- For mobile: Expo CLI

## Step 1: Start Docker Services

```bash
./scripts/start-docker.sh
```

This starts:
- PostgreSQL (port 5433)
- Neo4j (ports 7474, 7687)
- Redis (port 6379)
- Meilisearch (port 7700)
- MinIO (ports 9000, 9001)

## Step 2: Setup MinIO Bucket

```bash
./scripts/setup-minio.sh
```

## Step 3: Start API (Terminal 1)

```bash
cd apps/api
pnpm install
pnpm dev
```

API will run on http://localhost:3000

## Step 4: Start Web (Terminal 2)

```bash
cd apps/web
pnpm install
pnpm dev
```

Web will run on http://localhost:3001

## Step 5: Run Migrations

```bash
cd apps/api
pnpm migration:run
```

## Step 6: Test APIs

```bash
# Set your dev token
export DEV_TOKEN="your-token-here"

# Run tests
./scripts/test-all-apis.sh
```

## Step 7: Start Mobile (Terminal 3)

```bash
cd apps/mobile
pnpm install
pnpm start
```

Then:
- Press `i` for iOS
- Press `a` for Android
- Scan QR with Expo Go

## ✅ Verification

1. Check API health: http://localhost:3000/health
2. Check web app: http://localhost:3001
3. Run API tests: `./scripts/test-all-apis.sh`

## 🎉 Done!

Your CITE system is running with:
- ✅ Complete backend API
- ✅ Complete web frontend
- ✅ Complete mobile app
- ✅ All services in Docker
