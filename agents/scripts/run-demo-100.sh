#!/bin/bash
# Demo: 100 users (most public, ~15% private), more interaction and posts.
# Batches of 10 agents, 40 actions each = lots of posts, replies, follows, likes.
# Requires: Cite API running; OPENAI_API_KEY and CITE_ADMIN_SECRET in agents/.env (or USE_OLLAMA=1 for local Ollama).
# Usage: CITE_API_URL=http://localhost/api ./scripts/run-demo-100.sh
# Ollama: USE_OLLAMA=1 ./scripts/run-demo-100.sh  (uses granite4:latest by default)

set -e
cd "$(dirname "$0")/.."
export CITE_API_URL="${CITE_API_URL:-http://localhost/api}"

OLLAMA_FLAG=""
[[ -n "${USE_OLLAMA:-}" ]] && [[ "$USE_OLLAMA" != "0" ]] && OLLAMA_FLAG="--ollama"

# 10 batches × 10 agents = 100 users
BATCHES="${BATCHES:-10}"
AGENTS_PER_BATCH="${AGENTS_PER_BATCH:-10}"
# More actions = more posts, replies, quotes, follows, likes (demo feels alive)
ACTIONS="${ACTIONS:-40}"
# ~15% private/protected profiles (follow requests)
PRIVATE_RATIO="${PRIVATE_RATIO:-0.15}"

echo "Demo: 100 users, $ACTIONS actions each, ~15% private profiles (PRIVATE_RATIO=$PRIVATE_RATIO)."
[[ -n "$OLLAMA_FLAG" ]] && echo "Using Ollama (OLLAMA_MODEL=${OLLAMA_MODEL:-granite4:latest})."
echo ""

for i in $(seq 1 "$BATCHES"); do
  echo ""
  echo "=== Batch $i/$BATCHES ($AGENTS_PER_BATCH agents, $ACTIONS actions) ==="
  npm run run -- --seed-db --agents "$AGENTS_PER_BATCH" --actions "$ACTIONS" --private-ratio "$PRIVATE_RATIO" --save $OLLAMA_FLAG
  if [ "$i" -lt "$BATCHES" ]; then sleep 5; fi
done

echo ""
echo "Done. Total: $(( BATCHES * AGENTS_PER_BATCH )) users (personas in data/personas.json)."
echo "Resume for more content: npm run run -- --resume --actions $ACTIONS"
