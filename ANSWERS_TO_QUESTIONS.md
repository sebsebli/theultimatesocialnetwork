# Answers to Your Questions

## 1. Language Detection

### Current State
- ❌ **NOT using lingua-py** or any library
- ✅ Using simple heuristic-based detection (regex patterns)
- ✅ User entity has `languages: string[]` field

### What Happens When Unclear?
**Current behavior:**
- If confidence < 0.3: Defaults to English
- **Does NOT** use user profile language
- **Does NOT** use most common user language

**Recommended improvement:**
1. **First:** Use user's profile languages (`user.languages[]`)
2. **Second:** Use most common language from user's post history
3. **Third:** Default to English

### Recommendation: Use lingua-py
- Install: `pip install lingua-language-detector` (Python service)
- Or: `pnpm add @pemistahl/lingua` (JavaScript)
- Much more accurate than current heuristic
- Supports 75+ languages
- Fast and reliable

## 2. Content Moderation - Two-Stage Pipeline

### Current State
- ⚠️ Simple keyword matching: `['spam', 'violence', 'hate']`
- ⚠️ NOT using AI
- ⚠️ No cost optimization

### Recommended Implementation

**Stage 1: Fast Bayesian Filter**
- Use `natural` npm package (Bayesian classifier)
- Train on spam corpus
- Fast (~5ms), free (local)
- Catches 80% of obvious spam

**Stage 2: Gemma 3 270M (SLM)**
- Use Ollama: `ollama pull gemma2:2b`
- Or TensorFlow.js with quantized model
- Fast (~50-100ms), low cost (self-hosted)
- Handles ambiguous cases

**Flow:**
```
Content → Bayesian Filter → 
  ├─ High confidence spam → REJECT (80% of cases)
  ├─ High confidence safe → APPROVE (15% of cases)
  └─ Ambiguous → Gemma 3 270M → Final decision (5% of cases)
```

**Cost:** ~$0.0001 per check (mostly free, minimal for ambiguous cases)

## 3. "Mock AI" Explanation

### What It Means
The comment "Mock AI Content Safety Check" means:
- ❌ **NOT using real AI** (no ML model, no API)
- ✅ **Using simple keyword matching** as placeholder
- ⚠️ **Ready for AI upgrade** but not implemented yet

**Current code:**
```typescript
// This is NOT AI - just keyword matching
const forbidden = ['spam', 'violence', 'hate'];
if (forbidden.some(w => lower.includes(w))) {
  return { safe: false };
}
```

### Can We Automatically Explore Content for Users?

**YES!** Currently the explore endpoints exist but use simple queries, not AI.

**Current (NOT AI-powered):**
- Topics: `ORDER BY createdAt DESC`
- People: `ORDER BY followerCount DESC`
- Hardcoded reasons: `['Topic overlap', 'Frequently quoted']`

**Can be improved with AI:**
1. **Personalized recommendations** using embeddings
2. **Smart people discovery** using graph analysis + similarity
3. **Intelligent feed ranking** based on user interests
4. **Content recommendations** based on past engagement

**Implementation options:**
- Use `@xenova/transformers` for embeddings (local, free)
- Use Neo4j graph queries for social connections
- Use `pgvector` or Meilisearch for vector similarity
- Combine multiple signals for personalized ranking

## Summary

1. **Language Detection:** Not using lingua-py. Should upgrade and add fallback to user profile languages.

2. **Content Moderation:** Not using AI. Should implement two-stage pipeline (Bayesian → Gemma 3 270M).

3. **Explore/Recommendations:** Not using AI. Can be upgraded to AI-powered personalized recommendations using embeddings and graph analysis.

**All three can be improved with AI/ML for better accuracy and personalization!**
