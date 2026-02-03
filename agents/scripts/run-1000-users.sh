#!/bin/bash
# Run 1000 users in batches. Merge personas into data/personas.json.
# Smaller batches (10–20 agents) avoid API/nginx 503 under load.
# Requires: Cite API running; OPENAI_API_KEY and CITE_ADMIN_SECRET in agents/.env (or USE_OLLAMA=1 for local Ollama).
# Docker: CITE_API_URL=http://localhost/api ./scripts/run-1000-users.sh
# Ollama: USE_OLLAMA=1 ./scripts/run-1000-users.sh  (uses OLLAMA_MODEL=granite4:latest, OLLAMA_BASE_URL=http://localhost:11434)

set -e
cd "$(dirname "$0")/.."
export CITE_API_URL="${CITE_API_URL:-http://localhost/api}"

OLLAMA_FLAG=""
[[ -n "${USE_OLLAMA:-}" ]] && [[ "$USE_OLLAMA" != "0" ]] && OLLAMA_FLAG="--ollama"

# 50 batches × 20 agents = 1000 users (20 agents per batch keeps API stable)
BATCHES="${BATCHES:-50}"
AGENTS_PER_BATCH="${AGENTS_PER_BATCH:-20}"
ACTIONS="${ACTIONS:-12}"

for i in $(seq 1 "$BATCHES"); do
  echo ""
  echo "=== Batch $i/$BATCHES ($AGENTS_PER_BATCH agents, $ACTIONS actions) ==="
  npm run run -- --seed-db --agents "$AGENTS_PER_BATCH" --actions "$ACTIONS" --save $OLLAMA_FLAG
  # Short pause between batches to avoid rate limits
  if [ "$i" -lt "$BATCHES" ]; then sleep 5; fi
done

echo ""
echo "Done. Total: $(( BATCHES * AGENTS_PER_BATCH )) users (personas in data/personas.json)."
echo "Resume with: npm run run -- --resume --actions $ACTIONS"
