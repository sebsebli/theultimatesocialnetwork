#!/bin/bash
# Obtain or renew Let's Encrypt SSL certificates for citewalk.com using Certbot in Docker.
# Run from infra/docker. Requires port 80 free for first run or renewal (stop nginx first).
# Set CERTBOT_EMAIL in .env (required). Optional: CERTBOT_DOMAIN, CERTBOT_STAGING=1.
# Usage: ./init-ssl-certbot.sh [--renew]

set -e

RENEW=false
[ "${1:-}" = "--renew" ] && RENEW=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env for CERTBOT_EMAIL, CERTBOT_DOMAIN
if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  source .env 2>/dev/null || true
  set +a
fi

DOMAIN="${CERTBOT_DOMAIN:-citewalk.com}"
EMAIL="${CERTBOT_EMAIL:-}"
STAGING="${CERTBOT_STAGING:-}"

if [ -z "$EMAIL" ]; then
  echo "❌ CERTBOT_EMAIL is required in .env (e.g. CERTBOT_EMAIL=hello@citewalk.com)"
  exit 1
fi

mkdir -p ssl certbot-etc

# If we already have valid certs and not renewing, skip
if [ "$RENEW" = false ] && [ -f ssl/cert.pem ] && [ -f ssl/key.pem ]; then
  echo "✅ SSL certs already present in ./ssl (cert.pem, key.pem). Use --renew to refresh."
  exit 0
fi

if [ "$RENEW" = true ]; then
  echo "🔄 Renewing SSL certificate for $DOMAIN..."
else
  echo "🔒 Obtaining SSL certificate for $DOMAIN via Let's Encrypt (Certbot in Docker)..."
fi

CERTBOT_EXTRA=""
if [ -n "$STAGING" ]; then
  echo "   (using staging server to avoid rate limits)"
  CERTBOT_EXTRA="--staging"
fi

# Certbot: standalone binds to port 80. Ensure nothing else is on 80.
if command -v docker >/dev/null 2>&1; then
  if [ "$RENEW" = true ]; then
    docker run --rm \
      -p 80:80 \
      -v "$(pwd)/certbot-etc:/etc/letsencrypt" \
      certbot/certbot renew \
      --standalone \
      --non-interactive
  else
    # Request cert for both citewalk.com and www.citewalk.com
    docker run --rm \
      -p 80:80 \
      -v "$(pwd)/certbot-etc:/etc/letsencrypt" \
      certbot/certbot certonly \
      --standalone \
      -d "$DOMAIN" \
      -d "www.$DOMAIN" \
      --non-interactive \
      --agree-tos \
      --email "$EMAIL" \
      $CERTBOT_EXTRA
  fi
else
  echo "❌ Docker is required to run Certbot in this script."
  exit 1
fi

# Copy to format nginx expects (cert.pem, key.pem)
LIVE_DIR="certbot-etc/live/$DOMAIN"
if [ ! -f "$LIVE_DIR/fullchain.pem" ] || [ ! -f "$LIVE_DIR/privkey.pem" ]; then
  echo "❌ Certbot did not create expected files under $LIVE_DIR"
  exit 1
fi

cp "$LIVE_DIR/fullchain.pem" ssl/cert.pem
cp "$LIVE_DIR/privkey.pem" ssl/key.pem
chmod 600 ssl/key.pem

echo "✅ SSL certificates written to ./ssl (cert.pem, key.pem). You can start nginx."
