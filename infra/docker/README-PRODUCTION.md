# Production setup (Docker)

Use this when deploying Citewalk with `./deploy.sh prod`. Production uses HTTPS (Nginx + SSL) and enforces strong secrets.

## 1. Copy and fill `.env`

```bash
cp .env.example .env
```

Edit `.env` and set **production** values:

| Variable | Required in prod | Example |
|----------|------------------|---------|
| **JWT_SECRET** | Yes, strong non-default | `openssl rand -base64 32` |
| **METRICS_SECRET** | Yes | `openssl rand -base64 32` |
| **CITE_ADMIN_SECRET** | Yes, not `dev-admin-change-me` | `openssl rand -base64 32` |
| **FRONTEND_URL** | Yes, HTTPS | `https://yourdomain.com` |
| **NEXT_PUBLIC_API_URL** | Yes, HTTPS | `https://api.yourdomain.com` |
| **CORS_ORIGINS** | Yes | `https://yourdomain.com,https://api.yourdomain.com` |
| **SMTP_*** | Yes for emails | Your Brevo or SMTP credentials |
| POSTGRES_PASSWORD, NEO4J_PASSWORD, etc. | Yes | Strong values |

Never commit `.env`; it is in `.gitignore`.

## 2. SSL certificates (citewalk.com)

**Automatic (recommended on Hetzner):** If `ssl/cert.pem` and `ssl/key.pem` are missing, `./deploy.sh prod` will run Certbot in Docker to obtain Let's Encrypt certificates. Add to `.env`: `CERTBOT_EMAIL=hello@citewalk.com` (required for auto SSL). Optional: `CERTBOT_DOMAIN=citewalk.com`, `CERTBOT_STAGING=1` (for testing). Ensure **port 80** is free when Certbot runs; domain must point to the server's IP. **Renewal is automatic:** when using Terraform/cloud-init (Hetzner), a daily cron job runs at 3 AM to renew certs; otherwise add the cron yourself (see “SSL renewal” below).

**Manual:** Place your TLS certificate and private key in `./ssl/`:

- `ssl/cert.pem` — certificate (or full chain)
- `ssl/key.pem` — private key

Example with Let’s Encrypt:

```bash
mkdir -p ssl
cp /etc/letsencrypt/live/citewalk.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/citewalk.com/privkey.pem ssl/key.pem
chmod 600 ssl/key.pem
```

If you use manual certs, `./deploy.sh prod` will fail until these files exist.

## 3. Deploy

From `infra/docker`:

```bash
./deploy.sh prod
```

The script will:

1. Ensure `.env` exists (create from `.env.example` if missing).
2. **Production checks**: JWT_SECRET, METRICS_SECRET, CITE_ADMIN_SECRET (strong values).
3. **SSL**: If `ssl/cert.pem` or `ssl/key.pem` are missing, **automatically run `init-ssl-certbot.sh`** (requires CERTBOT_EMAIL in .env; port 80 free). Then verify certs exist.
4. Build images with `docker-compose.yml` + `docker-compose.prod.yml` (prod file is override-only: nginx SSL, MinIO no ports).
5. Start services (Nginx uses `nginx-ssl.conf`, HTTP→HTTPS redirect).
6. Run database migrations.
7. **SSL renewal**: Try to **automatically install a cron job** that runs `renew-ssl-cron.sh` daily at 3 AM. If that fails, it prints the `crontab` command to run manually.
8. Print status and logs.

## 4. MinIO / image storage (security)

**Do not expose MinIO (port 9000/9001) publicly.** The MinIO console and S3 API allow listing and downloading all bucket objects. With `docker-compose.prod.yml`, MinIO has **no published ports** — it is reachable only by the API and backup containers on the Docker network. Images are served to clients only via the API at `GET /images/:key` (use **API_URL** in backend and **NEXT_PUBLIC_API_URL** on web/mobile so clients never hit MinIO directly).

## 5. Prometheus (optional)

If you scrape `/metrics`, set **METRICS_SECRET** in `.env` and configure your scraper with the same value.

- **Bearer token**: `Authorization: Bearer <METRICS_SECRET>`
- **Custom header**: `X-Metrics-Secret: <METRICS_SECRET>`

See `prometheus.example.yml` for a Prometheus scrape config using `bearer_token`.

## 6. Persistence across restarts

The stack is configured to persist across host reboots and Docker restarts:

- **Restart policy:** Every service uses `restart: unless-stopped`. When the host or Docker daemon restarts, containers start again automatically.
- **Data:** All persistent data lives in `./volumes/` (db, neo4j, redis, meilisearch, minio, ollama, backups). These directories survive container removal and host reboots.
- **On Linux:** Ensure Docker starts on boot so the stack comes back after a reboot: `sudo systemctl enable docker` (and start the compose project from `infra/docker` after boot, or use a systemd unit that runs `docker compose up -d`).

## 7. Useful commands

```bash
# From infra/docker
COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

$COMPOSE_CMD ps
$COMPOSE_CMD logs -f api
$COMPOSE_CMD logs -f nginx
$COMPOSE_CMD down
$COMPOSE_CMD up -d --build
```

### 7a. SSL renewal (Let's Encrypt) — automatic

Certificates expire after 90 days. **Auto-renewal is enabled** when you provision the server with Terraform (`infra/terraform/cloud-init.yaml`): a cron job runs **daily at 3 AM** and executes `renew-ssl-cron.sh` (stops nginx → Certbot renew → starts nginx). The cron expects the repo at `/opt/citewalk`; adjust `/etc/cron.d/citewalk-ssl-renew` if your path is different. Logs: `/var/log/citewalk-ssl-renew.log`.

**Manual renew** (from `infra/docker`, port 80 must be free):

```bash
$COMPOSE_CMD stop nginx
./init-ssl-certbot.sh --renew
$COMPOSE_CMD start nginx
```

**Without Terraform:** add a cron entry so renewal runs automatically, e.g.:

```bash
0 3 * * * cd /path/to/infra/docker && ./renew-ssl-cron.sh >> /var/log/citewalk-ssl-renew.log 2>&1
```

## 7. Health endpoints (API)

- **GET /health** — Readiness: checks database and Redis. Used by Docker HEALTHCHECK and load balancers. Returns 503 if any dependency is down.
- **GET /health/live** — Liveness: returns 200 immediately (no DB/Redis). Use for Kubernetes livenessProbe if needed.

The API will not start in production without **CORS_ORIGINS** set in `.env` (validated at startup).

## 9. Checklist

- [ ] `.env` filled with production values (JWT_SECRET, METRICS_SECRET, CITE_ADMIN_SECRET, FRONTEND_URL, NEXT_PUBLIC_API_URL, CORS_ORIGINS, SMTP).
- [ ] FRONTEND_URL is HTTPS. CORS_ORIGINS is non-empty (comma-separated HTTPS origins).
- [ ] `ssl/cert.pem` and `ssl/key.pem` in place.
- [ ] `./deploy.sh prod` runs without errors.
- [ ] HTTPS works; HTTP redirects to HTTPS.
- [ ] Prometheus (if used) uses METRICS_SECRET as Bearer or X-Metrics-Secret.
