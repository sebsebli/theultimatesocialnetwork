#!/bin/bash

# Setup MinIO bucket for CITE images

echo "🪣 Setting up MinIO bucket..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
until curl -s http://localhost:9000/minio/health/live > /dev/null; do
  sleep 2
done

echo "✅ MinIO is ready!"

# Install mc if not available
if ! command -v mc &> /dev/null; then
  echo "📦 Installing MinIO Client (mc)..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install minio/stable/mc
  else
    wget https://dl.min.io/client/mc/release/linux-amd64/mc
    chmod +x mc
    sudo mv mc /usr/local/bin/
  fi
fi

# Configure mc alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
echo "🪣 Creating cite-images bucket..."
mc mb local/cite-images || echo "Bucket may already exist"

# Set public policy
echo "🔓 Setting bucket policy to public..."
mc anonymous set public local/cite-images

echo "✅ MinIO setup complete!"
echo "   Bucket: cite-images"
echo "   Public URL: http://localhost:9000/cite-images"
