# Setup Gemma 3 270M for Content Moderation

## Quick Setup (Local)

### Option 1: Using Ollama (Recommended)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull Gemma 2B model (closest to 270M, very fast)
ollama pull gemma2:2b

# Or try gemma:2b if available
ollama pull gemma:2b

# Start Ollama (usually runs automatically)
ollama serve
```

### Option 2: Using TensorFlow.js (Alternative)

The code will automatically fall back to keyword-based detection if Ollama is not available.

## Verification

Once Ollama is running, the API will automatically detect it on startup. Check logs for:
```
✅ Gemma 3 270M available for content moderation
```

If you see:
```
⚠️ Gemma not available, using fallback
```

Then Ollama is not running or Gemma model is not installed.

## Testing

The content moderation will work in two stages:
1. **Bayesian Filter** - Always active (catches repeated spam)
2. **Gemma 3 270M** - Active if Ollama is running (analyzes content safety)

Both run locally, no external APIs needed!
