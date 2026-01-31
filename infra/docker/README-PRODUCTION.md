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

## 2. SSL certificates

Place your TLS certificate and private key in `./ssl/`:

- `ssl/cert.pem` — certificate (or full chain)
- `ssl/key.pem` — private key

Example with Let’s Encrypt:

```bash
mkdir -p ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
chmod 600 ssl/key.pem
```

`./deploy.sh prod` will fail if these files are missing.

## 3. Deploy

From `infra/docker`:

```bash
./deploy.sh prod
```

The script will:

1. Ensure `.env` exists (create from `.env.example` if missing).
2. **Production checks**: JWT_SECRET, METRICS_SECRET, CITE_ADMIN_SECRET (strong values), and `ssl/cert.pem` / `ssl/key.pem`. If any check fails, it exits with instructions.
3. Build images with `docker-compose.yml` + `docker-compose.prod.yml`.
4. Start services (Nginx uses `nginx-ssl.conf`, HTTP→HTTPS redirect).
5. Run database migrations.
6. Print status and logs.

## 4. Prometheus (optional)

If you scrape `/metrics`, set **METRICS_SECRET** in `.env` and configure your scraper with the same value.

- **Bearer token**: `Authorization: Bearer <METRICS_SECRET>`
- **Custom header**: `X-Metrics-Secret: <METRICS_SECRET>`

See `prometheus.example.yml` for a Prometheus scrape config using `bearer_token`.

## 5. Useful commands

```bash
# From infra/docker
COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

$COMPOSE_CMD ps
$COMPOSE_CMD logs -f api
$COMPOSE_CMD logs -f nginx
$COMPOSE_CMD down
$COMPOSE_CMD up -d --build
```

## 6. Checklist

- [ ] `.env` filled with production values (JWT_SECRET, METRICS_SECRET, CITE_ADMIN_SECRET, FRONTEND_URL, NEXT_PUBLIC_API_URL, CORS_ORIGINS, SMTP).
- [ ] `ssl/cert.pem` and `ssl/key.pem` in place.
- [ ] `./deploy.sh prod` runs without errors.
- [ ] HTTPS works; HTTP redirects to HTTPS.
- [ ] Prometheus (if used) uses METRICS_SECRET as Bearer or X-Metrics-Secret.
