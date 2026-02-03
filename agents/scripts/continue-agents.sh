#!/bin/bash
# Continue all saved agents: more actions so they post, reply, quote, follow, tag, reference each other.
# Run from agents/ with CITE_API_URL set (e.g. CITE_API_URL=http://localhost/api).
# Usage: CITE_API_URL=http://localhost/api ./scripts/continue-agents.sh [rounds] [actions-per-round]
# Use local Ollama instead of OpenAI: USE_OLLAMA=1 ./scripts/continue-agents.sh [rounds] [actions]
#   Optional: OLLAMA_MODEL=granite4:latest (default), OLLAMA_BASE_URL=http://localhost:11434

set -e
cd "$(dirname "$0")/.."
export CITE_API_URL="${CITE_API_URL:-http://localhost/api}"

ROUNDS="${1:-5}"
ACTIONS="${2:-25}"
# Use local Ollama instead of OpenAI when USE_OLLAMA is set (e.g. USE_OLLAMA=1)
OLLAMA_FLAG=""
[[ -n "${USE_OLLAMA:-}" ]] && [[ "$USE_OLLAMA" != "0" ]] && OLLAMA_FLAG="--ollama"

echo "Continuing all agents: $ROUNDS round(s), $ACTIONS actions per agent per round."
[[ -n "$OLLAMA_FLAG" ]] && echo "Using Ollama (OLLAMA_MODEL=${OLLAMA_MODEL:-granite4:latest})."
echo "Personas file: data/personas.json"
echo ""

for r in $(seq 1 "$ROUNDS"); do
  echo "=== Round $r/$ROUNDS (each agent does $ACTIONS actions: post, reply, quote, follow, tag, reference) ==="
  npm run run -- --resume --actions "$ACTIONS" $OLLAMA_FLAG
  if [ "$r" -lt "$ROUNDS" ]; then
    echo "Pausing 10s before next round..."
    sleep 10
  fi
done

echo ""
echo "Done. Agents have added more content and interaction (references, tags, quotes, follows)."
