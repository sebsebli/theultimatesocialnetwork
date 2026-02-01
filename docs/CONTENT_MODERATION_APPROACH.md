# Content Moderation: State of the Art & Our Approach

## What modern social networks do (2024–2025)

### 1. **Pipeline order: fast first, LLM last**
- **Rules / hashes / lightweight classifiers** run first (low latency, cheap).
- **LLM** runs only when needed (e.g. borderline cases, or after clustering).
- Reduces cost and latency while keeping quality.

### 2. **Repetition / spammer detection**
- **Exact and near-duplicate** text (same or almost same message many times).
- **Semantic similarity** via embeddings: “user keeps posting very similar content” (language-agnostic).
- **Graph / temporal signals** (e.g. Facebook TIES): user behavior over time, interaction graphs. Used at very large scale; complex infra.

### 3. **Scaling LLM use**
- **Google (Ads)**: cluster similar content → LLM reviews only representative items → propagate decisions. Huge reduction in LLM calls.
- **Representative sampling**: don’t send every piece to the LLM; sample or cluster first.

### 4. **Near-duplicate at scale**
- **MinHash / SimHash + LSH**: compact hashes; very fast “same or almost same text” without embeddings. Used for dedup and copy-paste spam.
- Lexical only (no semantic “same meaning, different words”).

### 5. **Tradeoffs**
- **Meta PRO**: optimize response (ban, block, CAPTCHA, gather evidence) and balance abuse prevention vs. UX.
- **Precision vs. recall**: low false positives (don’t block legitimate users) is often prioritized.

---

## What we do today (production-grade)

| Stage | What | Purpose |
|-------|------|--------|
| **1a** | Exact / near-duplicate (DB text compare) | Same message 2+ times → block (REPEATED). |
| **1b** | SimHash near-duplicate (Redis cache) | 64-bit SimHash; if Hamming ≤ N to any of user’s last M hashes → block. **No network**, in-process + Redis. |
| **1c** | Embedding similarity (Ollama qwen3-embedding:0.6b) | User has 2+ recent posts/replies very similar → block. **One batch embed call**. |
| **2** | Ollama (qwen2.5:0.5b) with structured JSON | Single LLM check for spam, harassment, etc. Only when Stage 1 didn’t block. Time-bounded. |

- **Fail-safe**: All external calls in try/catch; on error we fail open (allow) and log. Never throws.
- **Configurable**: Env vars for thresholds and timeouts (see below).
- **Observability**: Prometheus counters (`cite_moderation_stage_total`) and histograms (`cite_moderation_duration_seconds`).
- **Timeouts**: Ollama chat and embed calls are time-bounded; timeouts configurable via env.

### Env vars (production tuning)

| Env | Default | Description |
|-----|---------|-------------|
| `MODERATION_MIN_SIMILAR_COUNT` | 2 | Min recent items with similarity above threshold to block. |
| `MODERATION_SIMILARITY_THRESHOLD` | 0.92 | Cosine similarity above this = “very similar” (embedding). |
| `MODERATION_MAX_RECENT_ITEMS` | 10 | Max recent posts/replies to compare (embedding). |
| `MODERATION_SIMHASH_HAMMING_MAX` | 3 | Max Hamming distance for SimHash near-dup (0–3 typical). |
| `MODERATION_SIMHASH_CACHE_SIZE` | 20 | How many SimHashes to keep per user in Redis. |
| `OLLAMA_CHAT_TIMEOUT_MS` | 8000 | Timeout for Ollama chat (text moderation). |
| `OLLAMA_EMBED_TIMEOUT_MS` | 15000 | Timeout for Ollama embed API. |
| `OLLAMA_HOST` | (unset) | When set, use Ollama for embed and chat. |
| `OLLAMA_EMBED_MODEL` | qwen3-embedding:0.6b | Embed model name. |

---

## Possible next steps (smarter & more performant)

1. **Store embeddings when content is created**  
   Persist embedding in DB (e.g. pgvector) or cache (e.g. Redis) when a post/reply is created. For similarity check: embed only the **new** text, then compare to stored vectors for that user. **No re-embedding of old content** → fewer embed calls and lower latency.

2. **SimHash for near-duplicate (no Ollama)**  
   Add a fast, local step: SimHash of text + store last N hashes per user (e.g. in Redis). If new SimHash is very close to a stored one (e.g. Hamming distance ≤ 3), treat as duplicate. Catches copy-paste and near-copies without any embed call; then use embeddings only for “semantic” similarity.

3. **LLM only for borderline / sample**  
   Optionally run the LLM only when:
   - Content is long enough or “suspicious” (e.g. link-heavy, first post), or  
   - A small random sample of content (e.g. 10%) for monitoring.  
   Reduces cost; needs clear rules to avoid missing abuse.

4. **Clustering + representative review**  
   Group similar content (e.g. by embedding), send one representative per cluster to the LLM, propagate decision. Large reduction in LLM calls; more engineering (clustering, propagation, storage).

5. **User-level signals**  
   Use simple counters (e.g. how often this user was flagged, or how many reports) to prioritize or skip LLM (e.g. “trusted” vs “new” vs “repeat offender”). Aligns with “optimize response” (e.g. PRO-style) without full graph/temporal models.

---

## Summary

- **State of the art**: fast/cheap filters first, graph/temporal and clustering at scale, LLM used sparingly or on representatives, strong focus on low false positives.
- **Our stack**: repetition (exact + embedding similarity in **one batch**), then **one** Ollama call for policy (spam, harassment, etc.). Batch embed keeps similarity checks efficient; optional next steps are storing embeddings and adding SimHash for even cheaper near-duplicate detection.
