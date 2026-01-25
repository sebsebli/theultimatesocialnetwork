#!/bin/bash

# Initialize Ollama and download Gemma 3 270M model

echo "Starting Ollama service..."
ollama serve &

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
for i in {1..30}; do
  if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# Try to pull gemma3:270m, fallback to gemma2:2b
echo "Downloading Gemma 3 270M model..."
if ollama pull gemma3:270m; then
  echo "✅ Successfully downloaded gemma3:270m"
elif ollama pull gemma2:2b; then
  echo "✅ Successfully downloaded gemma2:2b (fallback)"
elif ollama pull gemma:2b; then
  echo "✅ Successfully downloaded gemma:2b (fallback)"
else
  echo "⚠️ Failed to download Gemma model, will use fallback moderation"
fi

# Keep Ollama running
wait
