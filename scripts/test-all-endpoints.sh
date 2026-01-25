#!/bin/bash

# Comprehensive API Testing Script
# Tests all endpoints with realistic data

set -e

API_URL="${API_URL:-http://localhost:3000}"
BASE_URL="$API_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Test result tracking
declare -a FAILED_TESTS=()
declare -a WARNED_TESTS=()

# Helper functions
log_test() {
    local status=$1
    local test_name=$2
    local message=$3
    
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
    
    if [ "$http_code" == "$expected_status" ]; then
        log_test "PASS" "$test_name"
        echo "$body" | head -c 200
        echo ""
        return 0
    else
        log_test "FAIL" "$test_name" "Expected $expected_status, got $http_code"
        echo "Response: $body" | head -c 500
        echo ""
        return 1
    fi
}

# Check if API is running
echo -e "${BLUE}🔍 Checking API health...${NC}"
if curl -s -f "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ API is running${NC}\n"
else
    echo -e "${RED}✗ API is not running at $BASE_URL${NC}"
    echo "Please start the API first: cd infra/docker && docker compose up -d"
    exit 1
fi

echo -e "${BLUE}🧪 Starting comprehensive API tests...${NC}\n"

# ============================================================================
# 1. HEALTH & INFRASTRUCTURE
# ============================================================================
echo -e "${BLUE}📊 Health & Infrastructure${NC}"
test_endpoint "GET" "/health" "" 200 "Health check"
test_endpoint "GET" "/" "" 200 "Root endpoint"

# ============================================================================
# 2. AUTHENTICATION
# ============================================================================
echo -e "\n${BLUE}🔐 Authentication${NC}"

# Login (magic link request)
LOGIN_EMAIL="alice_writer@example.com"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$LOGIN_EMAIL\"}" \
    "$BASE_URL/auth/login" 2>&1)
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$LOGIN_CODE" ]; then
    log_test "PASS" "Login request"
    
    # Verify token (in real scenario, this would come from email)
    # For testing, we'll use a dev token if available
    DEV_TOKEN="${DEV_TOKEN:-}"
    if [ -z "$DEV_TOKEN" ]; then
        log_test "WARN" "Token verification" "DEV_TOKEN not set, skipping verification"
    else
        VERIFY_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"email\":\"$LOGIN_EMAIL\",\"code\":\"$LOGIN_CODE\"}" \
            "$BASE_URL/auth/verify" 2>&1)
        TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "$DEV_TOKEN")
        
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            log_test "PASS" "Token verification"
            AUTH_TOKEN="$TOKEN"
        else
            log_test "WARN" "Token verification" "Using DEV_TOKEN for remaining tests"
            AUTH_TOKEN="$DEV_TOKEN"
        fi
    fi
else
    log_test "FAIL" "Login request" "Failed to get login code"
    AUTH_TOKEN="${DEV_TOKEN:-}"
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}⚠ Continuing without authentication token${NC}"
    fi
fi

# ============================================================================
# 3. USERS
# ============================================================================
echo -e "\n${BLUE}👤 Users${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/users/me" "" 200 "Get current user" "$AUTH_TOKEN"
    test_endpoint "PATCH" "/users/me" '{"bio":"Updated bio"}' 200 "Update current user" "$AUTH_TOKEN"
fi

test_endpoint "GET" "/users/suggested" "" 200 "Get suggested users"
test_endpoint "GET" "/users/alice_writer" "" 200 "Get user by handle"

# ============================================================================
# 4. POSTS
# ============================================================================
echo -e "\n${BLUE}📝 Posts${NC}"

# Get a post ID first (assuming seeded data exists)
POSTS_RESPONSE=$(curl -s "$BASE_URL/feed?limit=1" 2>&1)
POST_ID=$(echo "$POSTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    test_endpoint "GET" "/posts/$POST_ID" "" 200 "Get post by ID"
    test_endpoint "GET" "/posts/$POST_ID/sources" "" 200 "Get post sources"
    test_endpoint "GET" "/posts/$POST_ID/referenced-by" "" 200 "Get post referenced by"
    
    if [ -n "$AUTH_TOKEN" ]; then
        test_endpoint "POST" "/posts/$POST_ID/like" "" "200|201" "Like post" "$AUTH_TOKEN"
        test_endpoint "POST" "/posts/$POST_ID/keep" "" "200|201" "Keep post" "$AUTH_TOKEN"
        test_endpoint "POST" "/posts/$POST_ID/view" "" 200 "Record view" "$AUTH_TOKEN"
    fi
else
    log_test "WARN" "Post operations" "No posts found, skipping post-specific tests"
fi

# Create a new post
if [ -n "$AUTH_TOKEN" ]; then
    NEW_POST_DATA='{"body":"# Test Post\n\nThis is a test post created during API testing. It includes a [[Topic]] link.","visibility":"PUBLIC"}'
    CREATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$NEW_POST_DATA" \
        "$BASE_URL/posts" 2>&1)
    NEW_POST_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$NEW_POST_ID" ] && [ "$NEW_POST_ID" != "null" ]; then
        log_test "PASS" "Create post"
        test_endpoint "DELETE" "/posts/$NEW_POST_ID" "" 200 "Delete post" "$AUTH_TOKEN"
    else
        log_test "FAIL" "Create post" "Failed to create post"
    fi
fi

# ============================================================================
# 5. FEED
# ============================================================================
echo -e "\n${BLUE}📰 Feed${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/feed" "" 200 "Get home feed" "$AUTH_TOKEN"
    test_endpoint "GET" "/feed?limit=10" "" 200 "Get feed with limit" "$AUTH_TOKEN"
    test_endpoint "GET" "/feed?offset=0&limit=20" "" 200 "Get feed with pagination" "$AUTH_TOKEN"
else
    test_endpoint "GET" "/feed" "" 401 "Get feed (unauthorized)"
fi

# ============================================================================
# 6. EXPLORE
# ============================================================================
echo -e "\n${BLUE}🔍 Explore${NC}"

test_endpoint "GET" "/explore/topics" "" 200 "Get topics"
test_endpoint "GET" "/explore/people" "" 200 "Get people recommendations"
test_endpoint "GET" "/explore/quoted-now" "" 200 "Get quoted now"
test_endpoint "GET" "/explore/deep-dives" "" 200 "Get deep dives"
test_endpoint "GET" "/explore/newsroom" "" 200 "Get newsroom"

# ============================================================================
# 7. TOPICS
# ============================================================================
echo -e "\n${BLUE}📚 Topics${NC}"

test_endpoint "GET" "/topics/artificial-intelligence" "" 200 "Get topic by slug"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "POST" "/topics/artificial-intelligence/follow" "" "200|201" "Follow topic" "$AUTH_TOKEN"
    test_endpoint "DELETE" "/topics/artificial-intelligence/follow" "" 200 "Unfollow topic" "$AUTH_TOKEN"
fi

# ============================================================================
# 8. SEARCH
# ============================================================================
echo -e "\n${BLUE}🔎 Search${NC}"

test_endpoint "GET" "/search/posts?q=test" "" 200 "Search posts"
test_endpoint "GET" "/search/users?q=alice" "" 200 "Search users"
test_endpoint "GET" "/search/posts?q=artificial+intelligence&limit=10" "" 200 "Search posts with limit"

# ============================================================================
# 9. COLLECTIONS
# ============================================================================
echo -e "\n${BLUE}📚 Collections${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    # Create collection
    COLLECTION_DATA='{"title":"Test Collection","description":"A test collection","isPublic":true}'
    COLLECTION_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$COLLECTION_DATA" \
        "$BASE_URL/collections" 2>&1)
    COLLECTION_ID=$(echo "$COLLECTION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$COLLECTION_ID" ] && [ "$COLLECTION_ID" != "null" ]; then
        log_test "PASS" "Create collection"
        test_endpoint "GET" "/collections" "" 200 "Get collections" "$AUTH_TOKEN"
        test_endpoint "GET" "/collections/$COLLECTION_ID" "" 200 "Get collection by ID" "$AUTH_TOKEN"
        
        # Add item to collection
        if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
            test_endpoint "POST" "/collections/$COLLECTION_ID/items" "{\"postId\":\"$POST_ID\"}" "200|201" "Add item to collection" "$AUTH_TOKEN"
        fi
    else
        log_test "FAIL" "Create collection" "Failed to create collection"
    fi
fi

# ============================================================================
# 10. REPLIES
# ============================================================================
echo -e "\n${BLUE}💬 Replies${NC}"

if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ] && [ -n "$AUTH_TOKEN" ]; then
    REPLY_DATA='{"body":"This is a test reply to the post."}'
    REPLY_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$REPLY_DATA" \
        "$BASE_URL/posts/$POST_ID/replies" 2>&1)
    REPLY_ID=$(echo "$REPLY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ -n "$REPLY_ID" ] && [ "$REPLY_ID" != "null" ]; then
        log_test "PASS" "Create reply"
        test_endpoint "GET" "/posts/$POST_ID/replies" "" 200 "Get replies" "$AUTH_TOKEN"
    else
        log_test "FAIL" "Create reply" "Failed to create reply"
    fi
fi

# ============================================================================
# 11. KEEPS
# ============================================================================
echo -e "\n${BLUE}🔖 Keeps${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/keeps" "" 200 "Get keeps" "$AUTH_TOKEN"
    test_endpoint "GET" "/keeps?limit=10" "" 200 "Get keeps with limit" "$AUTH_TOKEN"
fi

# ============================================================================
# 12. FOLLOWS
# ============================================================================
echo -e "\n${BLUE}👥 Follows${NC}"

# Get a user ID to follow
USERS_RESPONSE=$(curl -s "$BASE_URL/users/suggested?limit=1" 2>&1)
USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ] && [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "POST" "/users/$USER_ID/follow" "" "200|201" "Follow user" "$AUTH_TOKEN"
    test_endpoint "DELETE" "/users/$USER_ID/follow" "" 200 "Unfollow user" "$AUTH_TOKEN"
fi

# ============================================================================
# 13. MESSAGES
# ============================================================================
echo -e "\n${BLUE}💌 Messages${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/messages/threads" "" 200 "Get message threads" "$AUTH_TOKEN"
fi

# ============================================================================
# 14. NOTIFICATIONS
# ============================================================================
echo -e "\n${BLUE}🔔 Notifications${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/notifications" "" 200 "Get notifications" "$AUTH_TOKEN"
    test_endpoint "POST" "/notifications/read-all" "" 200 "Mark all notifications as read" "$AUTH_TOKEN"
fi

# ============================================================================
# 15. SAFETY
# ============================================================================
echo -e "\n${BLUE}🛡️ Safety${NC}"

if [ -n "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/safety/blocked" "" 200 "Get blocked users" "$AUTH_TOKEN"
    test_endpoint "GET" "/safety/muted" "" 200 "Get muted users" "$AUTH_TOKEN"
    
    if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
        test_endpoint "POST" "/safety/block/$USER_ID" "" "200|201" "Block user" "$AUTH_TOKEN"
        test_endpoint "DELETE" "/safety/block/$USER_ID" "" 200 "Unblock user" "$AUTH_TOKEN"
        test_endpoint "POST" "/safety/mute/$USER_ID" "" "200|201" "Mute user" "$AUTH_TOKEN"
        test_endpoint "DELETE" "/safety/mute/$USER_ID" "" 200 "Unmute user" "$AUTH_TOKEN"
    fi
fi

# ============================================================================
# 16. UPLOAD
# ============================================================================
echo -e "\n${BLUE}📤 Upload${NC}"

# Upload test would require actual file, skipping for now
if [ -n "$AUTH_TOKEN" ]; then
    log_test "WARN" "Upload header image" "Requires actual file upload, skipping"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings:${NC}"
    for test in "${WARNED_TESTS[@]}"; do
        echo -e "  ${YELLOW}⚠${NC} $test"
    done
    echo ""
fi

TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "Success Rate: ${SUCCESS_RATE}%"
fi

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All critical tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi
