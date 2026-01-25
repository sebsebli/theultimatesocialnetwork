# Language Detection Improvements

## Current State

**Current Implementation:**
- ✅ Simple heuristic-based detection (regex patterns for common words)
- ✅ NOT using lingua-py or any library
- ✅ User entity has `languages: string[]` field for user preferences
- ⚠️ If unclear, defaults to English with low confidence (0.3)

**Current Fallback Logic:**
```typescript
if (totalMatches === 0) {
  return { lang: 'en', confidence: 0.3 }; // Default to English with low confidence
}
```

## Recommended Improvements

### Option 1: Use lingua-py (Python) via API
- Fast and accurate
- Supports 75+ languages
- Can be called via HTTP API from Node.js

### Option 2: Use @pemistahl/lingua-js (JavaScript)
- Native Node.js implementation
- No external service needed
- Fast and accurate

### Option 3: Use fastText (via node-fasttext)
- Very fast
- Good accuracy
- Can run locally

## Improved Fallback Strategy

When language detection is unclear (confidence < 0.5):

1. **First Priority:** Use user's profile languages (`user.languages[]`)
   - If user has languages set, use the first one
   - If multiple, use the one with highest confidence match

2. **Second Priority:** Use most common language in user's posts
   - Query user's previous posts
   - Find most common `lang` value
   - Use that as fallback

3. **Third Priority:** Default to English
   - Only if no user languages and no post history

## Implementation Plan

```typescript
async detectLanguage(
  text: string, 
  userId?: string,
  userLanguages?: string[]
): Promise<{ lang: string; confidence: number }> {
  // 1. Try detection
  const detected = await this.detectLanguageInternal(text);
  
  // 2. If confidence low, try fallbacks
  if (detected.confidence < 0.5) {
    // Try user profile languages
    if (userLanguages && userLanguages.length > 0) {
      // Check if detected lang matches any user language
      if (userLanguages.includes(detected.lang)) {
        return { ...detected, confidence: 0.6 }; // Boost confidence
      }
      // Use first user language
      return { lang: userLanguages[0], confidence: 0.5 };
    }
    
    // Try user's post history
    if (userId) {
      const commonLang = await this.getUserMostCommonLanguage(userId);
      if (commonLang) {
        return { lang: commonLang, confidence: 0.5 };
      }
    }
  }
  
  return detected;
}
```
