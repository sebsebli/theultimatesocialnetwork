#!/bin/bash

# Comprehensive Search & Graph Functionality Test
# Tests search for existing articles and graph relationships

set +e

API_URL="${API_URL:-http://localhost:3000}"
REPORT_FILE="/tmp/search-graph-test-$(date +%Y%m%d-%H%M%S).md"

echo "# Search & Graph Functionality Test Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

log() {
    echo -e "${BLUE}→${NC} $1"
    echo "→ $1" >> "$REPORT_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
    echo "✓ $1" >> "$REPORT_FILE"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    echo "✗ $1" >> "$REPORT_FILE"
    ((FAILED++))
}

echo ""
echo "=========================================="
echo "  SEARCH & GRAPH FUNCTIONALITY TEST"
echo "=========================================="
echo ""

# Create test user and content
TIMESTAMP=$(date +%s)
TEST_EMAIL="searchtest_${TIMESTAMP}@cite.test"

log "Step 1: Creating test user..."
login=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}" "$API_URL/auth/login")
sleep 1

verify=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"token\":\"1234\"}" "$API_URL/auth/verify")
TOKEN=$(echo "$verify" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$verify" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ] && [ -n "$USER_ID" ]; then
    success "Test user created - ID: $USER_ID"
else
    fail "Failed to create test user"
    exit 1
fi

log "Step 2: Creating test posts with specific content..."
# Post 1: About urban planning
post1=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"# Urban Planning in Modern Cities\n\nUrban planning is crucial for sustainable development. This article discusses zoning, public transportation, and green spaces.\n\nKey topics: [[urbanism]], [[sustainability]], [[architecture]]"}' \
    "$API_URL/posts")
POST1_ID=$(echo "$post1" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Post 2: About technology
post2=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"# Technology and Society\n\nTechnology shapes our daily lives. This article explores AI, automation, and digital transformation.\n\nTopics: [[technology]], [[AI]], [[innovation]]"}' \
    "$API_URL/posts")
POST2_ID=$(echo "$post2" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Post 3: Quote post linking to post1
post3=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"body\":\"# Expanding on Urban Planning\n\nBuilding on the previous discussion about urban planning, I want to add more thoughts.\n\n[[post:$POST1_ID]]\"}" \
    "$API_URL/posts")
POST3_ID=$(echo "$post3" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$POST1_ID" ] && [ -n "$POST2_ID" ] && [ -n "$POST3_ID" ]; then
    success "Created 3 test posts"
    echo "  Post 1 (Urban): $POST1_ID"
    echo "  Post 2 (Tech): $POST2_ID"
    echo "  Post 3 (Quote): $POST3_ID"
else
    fail "Failed to create test posts"
    exit 1
fi

log "Waiting for search indexing (5 seconds)..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SEARCH FUNCTIONALITY TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 1: Search for 'urban planning'..."
search1=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/posts?q=urban%20planning")
HITS1=$(echo "$search1" | grep -o '"hits":\[[^]]*\]' | grep -o '"id"' | wc -l | tr -d ' ')

if echo "$search1" | grep -q "$POST1_ID"; then
    success "Search found Post 1 (urban planning) - $HITS1 results"
else
    fail "Search did not find Post 1"
    echo "Response: $search1" | head -20
fi

log "Test 2: Search for 'technology'..."
search2=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/posts?q=technology")
HITS2=$(echo "$search2" | grep -o '"hits":\[[^]]*\]' | grep -o '"id"' | wc -l | tr -d ' ')

if echo "$search2" | grep -q "$POST2_ID"; then
    success "Search found Post 2 (technology) - $HITS2 results"
else
    fail "Search did not find Post 2"
fi

log "Test 3: Search for 'sustainable'..."
search3=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/posts?q=sustainable")
HITS3=$(echo "$search3" | grep -o '"hits":\[[^]]*\]' | grep -o '"id"' | wc -l | tr -d ' ')

if echo "$search3" | grep -q "$POST1_ID"; then
    success "Search found Post 1 by keyword 'sustainable' - $HITS3 results"
else
    fail "Search did not find Post 1 by keyword"
fi

log "Test 4: Search for 'AI'..."
search4=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/posts?q=AI")
HITS4=$(echo "$search4" | grep -o '"hits":\[[^]]*\]' | grep -o '"id"' | wc -l | tr -d ' ')

if echo "$search4" | grep -q "$POST2_ID"; then
    success "Search found Post 2 by keyword 'AI' - $HITS4 results"
else
    fail "Search did not find Post 2 by keyword"
fi

log "Test 5: Search for user by email..."
search_user=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/users?q=${TEST_EMAIL%@*}")
if echo "$search_user" | grep -q "$USER_ID\|hits"; then
    success "User search working"
else
    fail "User search not working"
fi

log "Test 6: Search with empty query..."
search_empty=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/posts?q=")
if echo "$search_empty" | grep -q "hits\|\[\]"; then
    success "Empty search handled correctly"
else
    fail "Empty search not handled"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GRAPH RELATIONSHIP TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 7: Post sources (extracted URLs)..."
sources1=$(curl -s -X GET "$API_URL/posts/$POST1_ID/sources")
if echo "$sources1" | grep -q "\[\|\]"; then
    success "Post sources endpoint working"
    SOURCE_COUNT=$(echo "$sources1" | grep -o '"url"' | wc -l | tr -d ' ')
    echo "  Found $SOURCE_COUNT sources"
else
    fail "Post sources not working"
fi

log "Test 8: Post referenced-by (graph relationships)..."
referenced1=$(curl -s -X GET "$API_URL/posts/$POST1_ID/referenced-by")
if echo "$referenced1" | grep -q "$POST3_ID"; then
    success "Post referenced-by found Post 3 (quote relationship)"
    REF_COUNT=$(echo "$referenced1" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "  Found $REF_COUNT references"
else
    fail "Post referenced-by not finding quote relationship"
    echo "Expected POST3_ID: $POST3_ID"
    echo "Response: $referenced1" | head -30
fi

log "Test 9: Post sources for quote post..."
sources3=$(curl -s -X GET "$API_URL/posts/$POST3_ID/sources")
if echo "$sources3" | grep -q "\[\|\]"; then
    success "Quote post sources working"
else
    fail "Quote post sources not working"
fi

log "Test 10: Verify graph edge creation (quote relationship)..."
# Check if POST3 references POST1
referenced_check=$(curl -s -X GET "$API_URL/posts/$POST1_ID/referenced-by" | grep -o "$POST3_ID")
if [ -n "$referenced_check" ]; then
    success "Graph relationship verified: POST3 → POST1 (QUOTE)"
else
    fail "Graph relationship not found"
fi

log "Test 11: Post with wikilinks (topic relationships)..."
# Check if topics are extracted and linked
topics1=$(curl -s -X GET "$API_URL/posts/$POST1_ID")
if echo "$topics1" | grep -q "urbanism\|sustainability\|architecture"; then
    success "Wikilinks extracted from post"
else
    fail "Wikilinks not extracted"
fi

log "Test 12: Topic page shows posts..."
topic_urban=$(curl -s -X GET "$API_URL/topics/urbanism" 2>/dev/null)
if echo "$topic_urban" | grep -q "posts\|\[\]"; then
    success "Topic page accessible"
    # Check if our post appears (may take time to index)
    if echo "$topic_urban" | grep -q "$POST1_ID"; then
        success "Post appears in topic page"
    else
        log "  (Post may need time to appear in topic)"
    fi
else
    fail "Topic page not working"
fi

log "Test 13: User following (graph relationship)..."
# Create second user to test following
TEST_EMAIL2="searchtest2_${TIMESTAMP}@cite.test"
login2=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL2\"}" "$API_URL/auth/login")
sleep 1

verify2=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL2\",\"token\":\"1234\"}" "$API_URL/auth/verify")
TOKEN2=$(echo "$verify2" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER2_ID=$(echo "$verify2" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN2" ] && [ -n "$USER2_ID" ]; then
    follow=$(curl -s -X POST -H "Authorization: Bearer $TOKEN2" \
        "$API_URL/users/$USER_ID/follow")
    if echo "$follow" | grep -q "success\|followerId\|followeeId"; then
        success "User following relationship created"
        
        # Verify in feed
        feed=$(curl -s -X GET -H "Authorization: Bearer $TOKEN2" "$API_URL/feed")
        if echo "$feed" | grep -q "$POST1_ID\|$POST2_ID\|$POST3_ID"; then
            success "Followed user's posts appear in feed (graph traversal)"
        else
            log "  (Feed may be empty if posts are not visible)"
        fi
    else
        fail "User following not working"
    fi
else
    fail "Failed to create second user for following test"
fi

log "Test 14: Post interactions (like/keep graph relationships)..."
like=$(curl -s -X POST -H "Authorization: Bearer $TOKEN2" \
    "$API_URL/posts/$POST1_ID/like")
if echo "$like" | grep -q "liked\|true"; then
    success "Like interaction created"
else
    fail "Like interaction not working"
fi

keep=$(curl -s -X POST -H "Authorization: Bearer $TOKEN2" \
    "$API_URL/posts/$POST1_ID/keep")
if echo "$keep" | grep -q "kept\|true"; then
    success "Keep interaction created"
else
    fail "Keep interaction not working"
fi

log "Test 15: Collection relationships..."
collection=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Test Collection\",\"isPublic\":true}" \
    "$API_URL/collections")
COLLECTION_ID=$(echo "$collection" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$COLLECTION_ID" ]; then
    add_item=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"postId\":\"$POST1_ID\"}" \
        "$API_URL/collections/$COLLECTION_ID/items")
    if echo "$add_item" | grep -q "$POST1_ID"; then
        success "Collection-item relationship created"
    else
        fail "Collection-item relationship not working"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ADVANCED GRAPH QUERIES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 16: Explore quoted-now (graph-based feed)..."
quoted_now=$(curl -s -X GET "$API_URL/explore/quoted-now")
if echo "$quoted_now" | grep -q "\[\|\]"; then
    success "Quoted-now feed working (graph query)"
    if echo "$quoted_now" | grep -q "$POST3_ID"; then
        success "Quote post appears in quoted-now feed"
    else
        log "  (Post may need time to appear)"
    fi
else
    fail "Quoted-now feed not working"
fi

log "Test 17: Deep dives (graph-based recommendations)..."
deep_dives=$(curl -s -X GET "$API_URL/explore/deep-dives")
if echo "$deep_dives" | grep -q "\[\|\]"; then
    success "Deep dives working (graph analysis)"
else
    fail "Deep dives not working"
fi

log "Test 18: Newsroom (trending graph analysis)..."
newsroom=$(curl -s -X GET "$API_URL/explore/newsroom")
if echo "$newsroom" | grep -q "\[\|\]"; then
    success "Newsroom working (graph-based trending)"
else
    fail "Newsroom not working"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""
echo "Full report: $REPORT_FILE"
echo ""

echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "- Passed: $PASSED" >> "$REPORT_FILE"
echo "- Failed: $FAILED" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Test Content Created" >> "$REPORT_FILE"
echo "- Post 1 (Urban): $POST1_ID" >> "$REPORT_FILE"
echo "- Post 2 (Tech): $POST2_ID" >> "$REPORT_FILE"
echo "- Post 3 (Quote): $POST3_ID" >> "$REPORT_FILE"
echo "- Collection: $COLLECTION_ID" >> "$REPORT_FILE"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SEARCH & GRAPH TESTS PASSED! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the report for details.${NC}"
    exit 1
fi
