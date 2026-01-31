# Citewalk Social Network

A production-grade, full-stack social network built for verified information and citations.

## 🏗 Architecture

### Infrastructure (Hetzner Cloud EU)
- **Terraform:** Infrastructure as Code (IaC) provisioning for compliance and reproducibility.
- **Docker Compose:** Container orchestration for DB, API, Redis, and Search services.
- **Redis:** Distributed rate limiting and Socket.io adapter for scalability.

### Backend (NestJS)
- **API:** RESTful endpoints with automated Swagger/OpenAPI documentation (`/api/docs`).
- **Real-time:** Socket.io Gateway for instant notifications and messages.
- **Observability:** Structured JSON logging (`nestjs-pino`) and Prometheus metrics (`/metrics`).
- **Security:** Helmet, Throttler (Redis-backed), and JWT authentication.

### Frontend (Next.js)
- **Internationalization:** Full i18n support via `next-intl`.
- **UX:** Skeleton loading states, optimistic UI updates, and Toast notifications.
- **Testing:** Playwright E2E testing suite.

### Mobile (React Native / Expo)
- **Parity:** Full feature parity with web (Compose, Reading Mode, Profile).
- **Native Polish:** Custom Toast system, Haptics, and native-feeling navigation.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- npm (each app has its own package.json and deps)

### Docker Deployment (Recommended)

Deploy the entire stack with Docker:

```bash
cd infra/docker
cp .env.example .env
# Edit .env with your configuration
./deploy.sh dev  # or 'prod' for production
```

Or manually:
```bash
cd infra/docker
cp .env.example .env
docker compose up -d
```

Access the application:
- **Web App:** http://localhost:3001
- **API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs
- **Nginx (Reverse Proxy):** http://localhost

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed deployment instructions.

### Local Development

1.  **Start Infrastructure:**
    ```bash
    cd infra/docker
    cp .env.example .env
    docker-compose up -d
    ```

2.  **Run API:**
    ```bash
    cd apps/api
    npm install
    npm run start:dev
    ```

3.  **Run Web App:**
    ```bash
    cd apps/web
    npm install
    npm run dev
    ```

4.  **Run Mobile App:**
    ```bash
    cd apps/mobile
    npm install
    npm start
    ```

## 🧪 Testing

- **Web E2E:** `cd apps/web && npx playwright test`
- **API Unit:** `cd apps/api && npm test`

## 🌍 Internationalization

Translations are managed in:
- Web: `apps/web/messages/en.json`
- Mobile: `apps/mobile/i18n/locales/en.ts`

## 📚 API Documentation

Once the API is running, visit:
`http://localhost:3000/api/docs`