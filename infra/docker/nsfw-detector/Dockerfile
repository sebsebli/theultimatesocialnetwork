# NSFW image detection: Falconsai/nsfw_image_detection (ViT)
# https://huggingface.co/Falconsai/nsfw_image_detection
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# CPU-only PyTorch for smaller image
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Falconsai/nsfw_image_detection at build time so deployment has no runtime download
ENV HF_HOME=/app/.cache/huggingface
RUN python -c "from transformers import pipeline; pipeline('image-classification', model='Falconsai/nsfw_image_detection')"

COPY app.py .

EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
