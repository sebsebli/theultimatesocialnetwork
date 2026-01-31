#!/bin/bash
# Get the absolute path of the project root (4 levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
echo "Project root: $PROJECT_ROOT"

# 1. Ensure API is running with correct env
echo "Restarting API with dev env..."
cd "$PROJECT_ROOT/infra/docker" || { echo "Failed to cd to infra/docker"; exit 1; }
docker compose up -d api

# Return to root for npx
cd "$PROJECT_ROOT" || exit 1

# 2. Install ts-node if missing (it should be in devDependencies but let's be safe for the script runner)
# Actually, we use npx so it should be fine.

# 3. Run the script
echo "Running simulation..."
npx ts-node apps/api/src/scripts/seed-simulation.ts
