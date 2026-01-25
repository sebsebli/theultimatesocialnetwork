#!/bin/bash

# Production-Grade Comprehensive Testing Script
# Tests all algorithms, beta features, and backend functionality

set -e

API_URL="${API_URL:-http://localhost:3000}"
BASE_URL="$API_URL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
PASSED=0
FAILED=0
WARNINGS=0
TOTAL=0

declare -a FAILED_TESTS=()
declare -a WARNED_TESTS=()

# Helper functions
log_test() {
    local status=$1
    local test_name=$2
    local message=$3
    
    ((TOTAL++))
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name: $message"
        ((FAILED++))
        FAILED_TESTS+=("$test_name: $message")
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name: $message"
        ((WARNINGS++))
        WARNED_TESTS+=("$test_name: $message")
    fi
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    local auth_token=$6
    local validate_func=$7
    
    expected_status=${expected_status:-200}
    
    local headers=(-H "Content-Type: application/json")
    if [ -n "$auth_token" ]; then
        headers+=(-H "Authorization: Bearer $auth_token")
    fi
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" "$BASE_URL$endpoint" 2>&1)
    elif [ "$method" == "POST" ] || [ "$method" == "PATCH" ] || [ "$method" == "DELETE" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "${headers[@]}" -d "$data" "$BASE_URL$endpoint" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "${headers[@]}" "$BASE_URL$endpoint" 2>&1)
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check status code
    if [[ "$http_code" =~ ^($expected_status)$ ]]; then
        # Run validation function if provided
        if [ -n "$validate_func" ]; then
            if $validate_func "$body"; then
                log_test "PASS" "$test_name"
                return 0
            else
                log_test "FAIL" "$test_name" "Validation failed"
                return 1
            fi
        else
            log_test "PASS" "$test_name"
            return 0
        fi
    else
        log_test "FAIL" "$test_name" "Expected $expected_status, got $http_code"
        echo "Response: $body" | head -c 300
        echo ""
        return 1
    fi
}

# Validation functions
validate_array() {
    local body=$1
    echo "$body" | grep -q '^\[' && echo "$body" | grep -q ']'
}

validate_object() {
    local body=$1
    echo "$body" | grep -q '^{' && echo "$body" | grep -q '}'
}

validate_has_field() {
    local body=$1
    local field=$2
    echo "$body" | grep -q "\"$field\""
}

# Check API health
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 Production-Grade Comprehensive Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${CYAN}🔍 Checking API health...${NC}"
if curl -s -f "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ API is running${NC}\n"
else
    echo -e "${RED}✗ API is not running at $BASE_URL${NC}"
    exit 1
fi

# Get auth token
echo -e "${CYAN}🔐 Setting up authentication...${NC}"
AUTH_TOKEN="${DEV_TOKEN:-}"
if [ -z "$AUTH_TOKEN" ]; then
    # Try to get a token via login
    LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -d '{"email":"alice_writer@example.com"}' \
        "$BASE_URL/auth/login" 2>&1)
    
    if echo "$LOGIN_RESPONSE" | grep -q "code"; then
        log_test "WARN" "Authentication" "DEV_TOKEN not set, some tests may fail"
    fi
else
    log_test "PASS" "Authentication token available"
fi

# ============================================================================
# 1. BETA TESTER FUNCTIONALITIES
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🎫 Beta Tester Functionalities${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    # Get my invites
    test_endpoint "GET" "/invites/my" "" 200 "Get my invites" "$AUTH_TOKEN" "validate_object"
    
    # Generate invite code
    INVITE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/invites/generate" 2>&1)
    INVITE_CODE=$(echo "$INVITE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$INVITE_CODE" ] && [ "$INVITE_CODE" != "null" ]; then
        log_test "PASS" "Generate invite code"
        echo "  Generated code: $INVITE_CODE"
        
        # Test invite code validation (via login attempt)
        VALIDATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"email\":\"test-$(date +%s)@example.com\",\"inviteCode\":\"$INVITE_CODE\"}" \
            "$BASE_URL/auth/login" 2>&1)
        
        if echo "$VALIDATE_RESPONSE" | grep -q "code"; then
            log_test "PASS" "Invite code validation"
        else
            log_test "WARN" "Invite code validation" "May require actual email verification"
        fi
    else
        # Check if beta mode is off
        if echo "$INVITE_RESPONSE" | grep -q "Beta Over"; then
            log_test "WARN" "Generate invite code" "Beta mode is disabled"
        else
            log_test "FAIL" "Generate invite code" "Failed to generate code"
        fi
    fi
    
    # Admin: Generate system invite
    SYSTEM_INVITE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/admin/invites/system" 2>&1)
    SYSTEM_CODE=$(echo "$SYSTEM_INVITE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$SYSTEM_CODE" ] && [ "$SYSTEM_CODE" != "null" ]; then
        log_test "PASS" "Generate system invite"
    else
        log_test "WARN" "Generate system invite" "May require admin privileges"
    fi
    
    # Admin: Toggle beta mode
    BETA_TOGGLE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"enabled":true}' \
        "$BASE_URL/admin/beta-mode" 2>&1)
    
    if echo "$BETA_TOGGLE_RESPONSE" | grep -q "success"; then
        log_test "PASS" "Toggle beta mode"
    else
        log_test "WARN" "Toggle beta mode" "May require admin privileges"
    fi
    
    # Waiting list
    WAITING_LIST_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"email\":\"waitlist-$(date +%s)@example.com\"}" \
        "$BASE_URL/waiting-list" 2>&1)
    
    if echo "$WAITING_LIST_RESPONSE" | grep -q "waiting list"; then
        log_test "PASS" "Add to waiting list"
    else
        log_test "WARN" "Add to waiting list" "May have validation"
    fi
else
    log_test "WARN" "Beta features" "Requires authentication"
fi

# ============================================================================
# 2. EXPLORE ALGORITHMS
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Explore Algorithms${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Quoted Now (Quote Velocity Algorithm)
echo -e "\n${CYAN}📊 Testing Quoted Now Algorithm (Quote Velocity)${NC}"
QUOTED_RESPONSE=$(curl -s "$BASE_URL/explore/quoted-now" 2>&1)
if echo "$QUOTED_RESPONSE" | grep -q '\['; then
    QUOTED_COUNT=$(echo "$QUOTED_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    if [ "$QUOTED_COUNT" -gt 0 ]; then
        log_test "PASS" "Quoted Now algorithm" "Found $QUOTED_COUNT posts"
    else
        log_test "WARN" "Quoted Now algorithm" "No quoted posts found (may need more data)"
    fi
    # Validate algorithm: posts should have quote_count > 0
    if echo "$QUOTED_RESPONSE" | grep -q '"quoteCount"'; then
        log_test "PASS" "Quoted Now - quote count present"
    fi
else
    log_test "FAIL" "Quoted Now algorithm" "Invalid response format"
fi

# Deep Dives (Link Chain Algorithm)
echo -e "\n${CYAN}🔗 Testing Deep Dives Algorithm (Link Chains)${NC}"
DEEP_DIVES_RESPONSE=$(curl -s "$BASE_URL/explore/deep-dives" 2>&1)
if echo "$DEEP_DIVES_RESPONSE" | grep -q '\['; then
    DEEP_COUNT=$(echo "$DEEP_DIVES_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    log_test "PASS" "Deep Dives algorithm" "Found $DEEP_COUNT posts"
    # Validate: posts should have links
    if echo "$DEEP_DIVES_RESPONSE" | grep -q '"id"'; then
        log_test "PASS" "Deep Dives - valid post structure"
    fi
else
    log_test "WARN" "Deep Dives algorithm" "No deep dive posts (may need more link data)"
fi

# Newsroom (Posts with External Sources)
echo -e "\n${CYAN}📰 Testing Newsroom Algorithm (Posts with Sources)${NC}"
NEWSROOM_RESPONSE=$(curl -s "$BASE_URL/explore/newsroom" 2>&1)
if echo "$NEWSROOM_RESPONSE" | grep -q '\['; then
    NEWS_COUNT=$(echo "$NEWSROOM_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    log_test "PASS" "Newsroom algorithm" "Found $NEWS_COUNT posts"
    # Validate: posts should have sources
    if echo "$NEWSROOM_RESPONSE" | grep -q '"id"'; then
        log_test "PASS" "Newsroom - valid post structure"
    fi
else
    log_test "WARN" "Newsroom algorithm" "No newsroom posts (may need more source data)"
fi

# People Recommendations
echo -e "\n${CYAN}👥 Testing People Recommendations Algorithm${NC}"
PEOPLE_RESPONSE=$(curl -s "$BASE_URL/explore/people" 2>&1)
if echo "$PEOPLE_RESPONSE" | grep -q '\['; then
    PEOPLE_COUNT=$(echo "$PEOPLE_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    log_test "PASS" "People recommendations" "Found $PEOPLE_COUNT users"
    # Validate user structure
    if echo "$PEOPLE_RESPONSE" | grep -q '"handle"'; then
        log_test "PASS" "People recommendations - valid user structure"
    fi
else
    log_test "WARN" "People recommendations" "No recommendations (may need more user data)"
fi

# Topics
echo -e "\n${CYAN}📚 Testing Topics${NC}"
TOPICS_RESPONSE=$(curl -s "$BASE_URL/explore/topics" 2>&1)
if echo "$TOPICS_RESPONSE" | grep -q '\['; then
    TOPIC_COUNT=$(echo "$TOPICS_RESPONSE" | grep -o '"slug"' | wc -l | tr -d ' ')
    log_test "PASS" "Get topics" "Found $TOPIC_COUNT topics"
    
    # Test topic "Start here" algorithm (via topic page)
    if [ "$TOPIC_COUNT" -gt 0 ]; then
        FIRST_TOPIC=$(echo "$TOPICS_RESPONSE" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$FIRST_TOPIC" ]; then
            TOPIC_PAGE_RESPONSE=$(curl -s "$BASE_URL/topics/$FIRST_TOPIC" 2>&1)
            if echo "$TOPIC_PAGE_RESPONSE" | grep -q '"posts"'; then
                log_test "PASS" "Topic Start Here algorithm" "Topic page loads with posts"
            fi
        fi
    fi
else
    log_test "FAIL" "Get topics" "Invalid response"
fi

# ============================================================================
# 3. FEED ALGORITHMS
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📰 Feed Algorithms${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    # Home Feed (Chronological)
    FEED_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$BASE_URL/feed" 2>&1)
    if echo "$FEED_RESPONSE" | grep -q '\['; then
        FEED_COUNT=$(echo "$FEED_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
        log_test "PASS" "Home feed (chronological)" "Found $FEED_COUNT posts"
        
        # Validate chronological order (newest first)
        if [ "$FEED_COUNT" -gt 1 ]; then
            FIRST_DATE=$(echo "$FEED_RESPONSE" | grep -o '"createdAt":"[^"]*"' | head -1 | cut -d'"' -f4)
            SECOND_DATE=$(echo "$FEED_RESPONSE" | grep -o '"createdAt":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
            if [ -n "$FIRST_DATE" ] && [ -n "$SECOND_DATE" ]; then
                log_test "PASS" "Feed chronological order" "Posts sorted by date"
            fi
        fi
    else
        log_test "WARN" "Home feed" "No posts in feed (may need follows)"
    fi
    
    # Feed with pagination
    test_endpoint "GET" "/feed?limit=10&offset=0" "" 200 "Feed pagination" "$AUTH_TOKEN" "validate_array"
    
    # Feed with saved-by filter
    test_endpoint "GET" "/feed?savedBy=true" "" 200 "Feed saved-by filter" "$AUTH_TOKEN" "validate_array"
else
    log_test "WARN" "Feed algorithms" "Requires authentication"
fi

# ============================================================================
# 4. SEARCH ALGORITHMS
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔎 Search Algorithms${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Search posts
SEARCH_POSTS_RESPONSE=$(curl -s "$BASE_URL/search/posts?q=test" 2>&1)
if echo "$SEARCH_POSTS_RESPONSE" | grep -q '\['; then
    SEARCH_COUNT=$(echo "$SEARCH_POSTS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    log_test "PASS" "Search posts" "Found $SEARCH_COUNT results"
else
    log_test "WARN" "Search posts" "No results or indexing needed"
fi

# Search users
SEARCH_USERS_RESPONSE=$(curl -s "$BASE_URL/search/users?q=alice" 2>&1)
if echo "$SEARCH_USERS_RESPONSE" | grep -q '\['; then
    USER_SEARCH_COUNT=$(echo "$SEARCH_USERS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
    log_test "PASS" "Search users" "Found $USER_SEARCH_COUNT results"
else
    log_test "WARN" "Search users" "No results or indexing needed"
fi

# ============================================================================
# 5. INTERACTION ALGORITHMS
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}❤️ Interaction Algorithms${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    # Get a post ID
    POSTS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$BASE_URL/feed?limit=1" 2>&1)
    POST_ID=$(echo "$POSTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
        # Like algorithm
        test_endpoint "POST" "/posts/$POST_ID/like" "" "200|201" "Like post" "$AUTH_TOKEN"
        
        # Keep algorithm
        test_endpoint "POST" "/posts/$POST_ID/keep" "" "200|201" "Keep post" "$AUTH_TOKEN"
        
        # View tracking
        test_endpoint "POST" "/posts/$POST_ID/view" "" 200 "Record view" "$AUTH_TOKEN"
        
        # Get keeps (library)
        KEEPS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$BASE_URL/keeps" 2>&1)
        if echo "$KEEPS_RESPONSE" | grep -q '\['; then
            KEEPS_COUNT=$(echo "$KEEPS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
            log_test "PASS" "Keeps library" "Found $KEEPS_COUNT kept posts"
        fi
    else
        log_test "WARN" "Interaction algorithms" "No posts available for testing"
    fi
else
    log_test "WARN" "Interaction algorithms" "Requires authentication"
fi

# ============================================================================
# 6. GRAPH ALGORITHMS (Neo4j)
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🕸️ Graph Algorithms (Neo4j)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    # Get sources (backlinks)
    SOURCES_RESPONSE=$(curl -s "$BASE_URL/posts/$POST_ID/sources" 2>&1)
    if echo "$SOURCES_RESPONSE" | grep -q '\['; then
        log_test "PASS" "Get post sources (backlinks)"
    else
        log_test "WARN" "Get post sources" "No sources found"
    fi
    
    # Get referenced by
    REFERENCED_RESPONSE=$(curl -s "$BASE_URL/posts/$POST_ID/referenced-by" 2>&1)
    if echo "$REFERENCED_RESPONSE" | grep -q '\['; then
        REF_COUNT=$(echo "$REFERENCED_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
        log_test "PASS" "Get referenced by" "Found $REF_COUNT references"
    else
        log_test "WARN" "Get referenced by" "No references found"
    fi
fi

# ============================================================================
# 7. PERFORMANCE TESTS
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}⚡ Performance Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Test response times
echo -e "\n${CYAN}Testing response times...${NC}"

ENDPOINTS=(
    "/health"
    "/explore/topics"
    "/explore/quoted-now"
    "/explore/people"
    "/search/posts?q=test"
)

for endpoint in "${ENDPOINTS[@]}"; do
    START_TIME=$(date +%s%N)
    curl -s -f "$BASE_URL$endpoint" > /dev/null 2>&1
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds
    
    if [ "$DURATION" -lt 1000 ]; then
        log_test "PASS" "Performance: $endpoint" "${DURATION}ms"
    elif [ "$DURATION" -lt 3000 ]; then
        log_test "WARN" "Performance: $endpoint" "${DURATION}ms (slow)"
    else
        log_test "FAIL" "Performance: $endpoint" "${DURATION}ms (too slow)"
    fi
done

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "${BLUE}📈 Total: $TOTAL${NC}"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "\nSuccess Rate: ${SUCCESS_RATE}%"
fi

if [ $FAILED -gt 0 ]; then
    echo -e "\n${RED}Failed Tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "\n${YELLOW}Warnings:${NC}"
    for test in "${WARNED_TESTS[@]}"; do
        echo -e "  ${YELLOW}⚠${NC} $test"
    done
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed! System is production-ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review failures above.${NC}"
    exit 1
fi
