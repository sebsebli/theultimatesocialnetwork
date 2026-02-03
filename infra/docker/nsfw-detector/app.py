"""
NSFW image detection service using Falconsai/nsfw_image_detection (ViT).
https://huggingface.co/Falconsai/nsfw_image_detection
Exposes POST /classify: raw image bytes → { "safe": bool, "confidence": float }.
"""
import io
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

classifier = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model once at startup."""
    global classifier
    try:
        from transformers import pipeline

        logger.info("Loading Falconsai/nsfw_image_detection...")
        classifier = pipeline(
            "image-classification",
            model="Falconsai/nsfw_image_detection",
        )
        logger.info("Model loaded.")
    except Exception as e:
        logger.exception("Failed to load model: %s", e)
        raise
    yield
    classifier = None


app = FastAPI(title="NSFW Image Detector", lifespan=lifespan)


@app.get("/health")
async def health():
    """Health check: model must be loaded."""
    if classifier is None:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "reason": "model not loaded"},
        )
    return {"status": "ok"}


@app.post("/classify")
async def classify(request: Request):
    """
    Classify image: POST raw image bytes (JPEG/PNG/WEBP).
    Returns { "safe": true|false, "confidence": float }.
    safe = (predicted label == "normal").
    """
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    body = await request.body()
    if len(body) < 100:
        return {"safe": False, "confidence": 1.0, "reason": "corrupt"}
    try:
        img = Image.open(io.BytesIO(body)).convert("RGB")
    except Exception as e:
        logger.warning("Invalid image: %s", e)
        return {"safe": False, "confidence": 1.0, "reason": "invalid image"}
    try:
        result = classifier(img)
        # result e.g. [{"label": "normal", "score": 0.98}, {"label": "nsfw", "score": 0.02}]
        top = result[0] if result else {}
        label = (top.get("label") or "").lower()
        score = float(top.get("score") or 0)
        safe = label == "normal"
        return {
            "safe": safe,
            "confidence": score,
            "reason": "NSFW" if not safe else "normal",
        }
    except Exception as e:
        logger.exception("Classification failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
