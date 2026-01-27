#!/bin/bash
# Fetch and display Docker Compose logs for troubleshooting http://localhost
# Usage: ./check-logs.sh [output.txt]
set -e
cd "$(dirname "$0")"
OUT="${1:-}"

run() {
  if [[ -n "$OUT" ]]; then
    "$@" 2>&1 | tee -a "$OUT"
  else
    "$@" 2>&1
  fi
}

if [[ -n "$OUT" ]]; then
  : > "$OUT"
  echo "Writing to $OUT"
fi

# Fail fast if Docker daemon is not reachable (avoids long hangs)
echo "=== Checking Docker daemon ==="
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running or not reachable."
  echo "Start Docker Desktop (or your Docker daemon), then run this script again."
  exit 1
fi
echo "Docker daemon OK"
echo ""

echo "=== Docker Compose status ==="
run docker compose ps -a || true

echo ""
echo "=== Nginx logs (last 50 lines) ==="
run docker compose logs --tail=50 nginx || true

echo ""
echo "=== Web (Next.js) logs (last 50 lines) ==="
run docker compose logs --tail=50 web || true

echo ""
echo "=== API logs (last 50 lines) ==="
run docker compose logs --tail=50 api || true

echo ""
echo "=== All services logs (last 20 lines each) ==="
run docker compose logs --tail=20 || true
