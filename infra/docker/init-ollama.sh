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

# Try to pull fast models
echo "Downloading models..."
ollama pull qwen2-vl
ollama pull qwen2.5:0.5b


# Keep Ollama running
wait
