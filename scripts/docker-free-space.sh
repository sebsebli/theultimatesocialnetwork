#!/usr/bin/env bash
# Free Docker disk space so builds (e.g. web 2.45GB context) don't hit "no space left on device".
# Run from repo root: ./scripts/docker-free-space.sh

set -e
echo "🗑️  Docker disk usage before:"
docker system df

echo ""
echo "Removing build cache (largest space saver)..."
docker builder prune -af

echo ""
echo "Removing unused images, containers, networks..."
docker system prune -af

echo ""
echo "Docker disk usage after:"
docker system df
echo ""
echo "✅ Done. Retry: ./scripts/reset-docker.sh --rebuild"
echo "   Or deploy without full rebuild: ./scripts/deploy.sh local"
