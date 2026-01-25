# AI-Powered Explore & Content Recommendations

## Current State

**Current Implementation:**
- ✅ Explore endpoints exist: `/explore/topics`, `/explore/people`, `/explore/quoted-now`, etc.
- ⚠️ **NOT using AI** - using simple database queries:
  - Topics: Ordered by `createdAt DESC`
  - People: Ordered by `followerCount DESC`
  - Quoted-now: Simple quote count
  - Deep dives: Backlink count
  - Newsroom: Posts with external sources

**Current Logic:**
```typescript
// Simple, not AI-powered
async getPeople(userId?: string) {
  const users = await this.userRepo.find({ 
    take: 20, 
    order: { followerCount: 'DESC' },
  });
  return users.map(u => ({
    ...u,
    reasons: ['Topic overlap', 'Frequently quoted'], // Hardcoded!
  }));
}
```

## What "Mock AI" Means

The comment "Mock AI Content Safety Check" means:
- ❌ **NOT using real AI** (no OpenAI, no Google Cloud, no ML model)
- ✅ **Using simple keyword matching** instead
- ⚠️ **Placeholder** for future AI integration

**Current Safety Check:**
```typescript
// This is NOT AI - just keyword matching
const forbidden = ['spam', 'violence', 'hate'];
if (forbidden.some(w => lower.includes(w))) {
  return { safe: false };
}
```

## Can We Automatically Explore Content for Users?

**YES!** We can implement AI-powered recommendations:

### 1. Personalized Topic Recommendations
- Analyze user's post history
- Find topics they engage with
- Recommend similar topics
- Use embeddings for semantic similarity

### 2. Smart People Discovery
- Find users with similar interests (based on posts, topics, quotes)
- Use graph analysis (Neo4j) to find connections
- Recommend based on mutual follows, topic overlap
- Use embeddings for user similarity

### 3. Intelligent Feed Ranking
- Current: Chronological
- AI-powered: Rank by relevance, engagement prediction
- Use user's language preferences
- Filter by user's blocked/muted users
- Personalize based on past interactions

### 4. Content Recommendations
- "You might like" based on:
  - Posts you've liked/kept
  - Topics you follow
  - Users you follow
  - Similar content patterns

## Implementation Strategy

### Option 1: Embeddings + Similarity Search
```typescript
// Use sentence transformers or OpenAI embeddings
async getRecommendedPosts(userId: string) {
  // 1. Get user's liked/kept posts
  const userPosts = await this.getUserEngagedPosts(userId);
  
  // 2. Generate embeddings for user's interests
  const userEmbedding = await this.generateEmbedding(userPosts);
  
  // 3. Find similar posts using vector similarity
  const similarPosts = await this.vectorSearch(userEmbedding);
  
  return similarPosts;
}
```

### Option 2: Graph-Based Recommendations (Neo4j)
```cypher
// Find users similar to current user
MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User)
MATCH (f)-[:FOLLOWS]->(similar:User)
WHERE similar.id <> $userId
RETURN similar, count(*) as mutualFollows
ORDER BY mutualFollows DESC
LIMIT 20
```

### Option 3: Hybrid Approach
- Use embeddings for content similarity
- Use graph for social connections
- Combine scores for final ranking

## Recommended Libraries

1. **Embeddings:**
   - `@xenova/transformers` - Run sentence transformers locally
   - `openai` - Use OpenAI embeddings API
   - `@google-cloud/aiplatform` - Use Google embeddings

2. **Vector Search:**
   - `pgvector` - PostgreSQL vector extension
   - `meilisearch` - Already using, supports vector search
   - `qdrant` - Dedicated vector database

3. **Recommendation Algorithms:**
   - Collaborative filtering
   - Content-based filtering
   - Hybrid approaches

## Next Steps

1. **Add embeddings to posts:**
   - Generate embeddings when posts are created
   - Store in database or vector DB
   - Index for fast similarity search

2. **Implement recommendation service:**
   - Create `RecommendationService`
   - Use embeddings + graph analysis
   - Personalize based on user profile

3. **Update explore endpoints:**
   - Replace simple queries with AI-powered recommendations
   - Add personalization
   - Use user's language preferences

4. **Add "For You" feed:**
   - New endpoint: `/feed/for-you`
   - AI-ranked personalized feed
   - Combines multiple signals
