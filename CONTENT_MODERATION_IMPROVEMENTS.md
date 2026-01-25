# Content Moderation Improvements - Two-Stage Pipeline

## Current State

**Current Implementation:**
- ⚠️ Simple keyword matching: `['spam', 'violence', 'hate']`
- ⚠️ Comment says "Mock AI" because it's NOT using real AI
- ⚠️ No nuanced analysis
- ⚠️ No cost optimization

## Recommended: Two-Stage Pipeline

### Stage 1: Fast Bayesian Filter (Traditional ML)
**Purpose:** Catch obvious spam quickly and cheaply

**Implementation:**
- Use a pre-trained Bayesian classifier
- Fast (milliseconds)
- Low cost (local computation)
- High precision for obvious spam

**Libraries:**
- `bayes` (npm) - Simple Bayesian classifier
- `natural` (npm) - NLP toolkit with classifiers
- Train on your own spam corpus

### Stage 2: Gemma 3 270M (SLM)
**Purpose:** Nuanced analysis for ambiguous cases

**When to use:**
- Only when Stage 1 is uncertain (confidence between thresholds)
- For edge cases that need context understanding
- For subtle violations

**Implementation:**
- Use Gemma 3 270M via Ollama or similar
- Run locally or on GPU server
- Fast inference (~50-100ms)
- Low cost (self-hosted)

## Architecture

```typescript
async checkContent(text: string): Promise<{ safe: boolean; reason?: string; confidence: number }> {
  // Stage 1: Fast Bayesian Filter
  const bayesianResult = await this.bayesianClassifier.classify(text);
  
  if (bayesianResult.confidence > 0.9 && bayesianResult.isSpam) {
    // Obvious spam - reject immediately
    return { 
      safe: false, 
      reason: 'Content flagged by spam filter',
      confidence: bayesianResult.confidence 
    };
  }
  
  if (bayesianResult.confidence > 0.9 && !bayesianResult.isSpam) {
    // Obviously safe - approve immediately
    return { 
      safe: true, 
      confidence: bayesianResult.confidence 
    };
  }
  
  // Stage 2: Ambiguous case - use Gemma 3 270M
  if (bayesianResult.confidence < 0.9) {
    const gemmaResult = await this.gemmaModel.analyze(text);
    return {
      safe: gemmaResult.safe,
      reason: gemmaResult.reason,
      confidence: gemmaResult.confidence
    };
  }
  
  return { safe: true, confidence: 0.5 };
}
```

## Cost Optimization

**Expected Flow:**
- ~80% of content: Stage 1 only (fast, free)
- ~20% of content: Stage 1 + Stage 2 (still fast, minimal cost)

**Cost per check:**
- Stage 1: ~$0 (local computation)
- Stage 2: ~$0.0001 (self-hosted Gemma 3 270M)

## Implementation Steps

1. **Install dependencies:**
   ```bash
   pnpm add natural @tensorflow/tfjs-node
   # or use Ollama for Gemma 3
   ```

2. **Train Bayesian classifier:**
   - Collect spam/non-spam corpus
   - Train classifier
   - Save model

3. **Set up Gemma 3 270M:**
   - Use Ollama: `ollama pull gemma2:2b` (or similar)
   - Or use TensorFlow.js with quantized model
   - Create inference service

4. **Integrate two-stage pipeline:**
   - Update `SafetyService.checkContent()`
   - Add confidence thresholds
   - Route ambiguous cases to Gemma
