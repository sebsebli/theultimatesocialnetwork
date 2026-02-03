#!/bin/bash
# Initialize Ollama: serve and pull models for text moderation (granite4) and embeddings.
# No vision model – image moderation uses NSFW detector (Falconsai/nsfw_image_detection) when configured.
# On any pull failure this script exits and the container exits (deployment will be cancelled).
set -e

echo "Starting Ollama service..."
ollama serve &

# Wait for Ollama to be ready (use ollama CLI; container may not have curl)
echo "Waiting for Ollama to be ready..."
for i in $(seq 1 30); do
  if ollama list >/dev/null 2>&1; then
    echo "Ollama is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done
if ! ollama list >/dev/null 2>&1; then
  echo "Ollama failed to become ready."
  exit 1
fi

# Text moderation model (granite4:latest)
TEXT_MODEL="${OLLAMA_TEXT_MODEL:-granite4:latest}"
echo "Pulling text moderation model $TEXT_MODEL..."
ollama pull "$TEXT_MODEL"

# Embedding model
echo "Pulling embedding model..."
ollama pull qwen3-embedding:0.6b

echo "All models ready."
# Keep Ollama running
wait
