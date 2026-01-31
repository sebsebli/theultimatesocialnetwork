#!/bin/bash

# Comprehensive API Test Script
# Tests all endpoints with proper error handling

API_URL="${API_URL:-http://localhost:3000}"
DEV_TOKEN="${DEV_TOKEN:-}"

echo "🧪 Testing Citewalk API - All Endpoints"
echo "===================================="
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  local requires_auth=${5:-true}
  
  printf "${BLUE}%-50s${NC}" "$description"
  
  local headers=()
  if [ "$requires_auth" = "true" ] && [ -n "$DEV_TOKEN" ]; then
    headers+=("-H" "Authorization: Bearer $DEV_TOKEN")
  fi
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${headers[@]}" "$API_URL$endpoint" 2>/dev/null)
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
      "${headers[@]}" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint" 2>/dev/null)
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
      "${headers[@]}" \
      "$API_URL$endpoint" 2>/dev/null)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓${NC} (HTTP $http_code)"
    ((PASSED++))
  elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
    echo -e "${YELLOW}⚠${NC} (HTTP $http_code - Auth required)"
    ((SKIPPED++))
  elif [ "$http_code" -eq 404 ]; then
    echo -e "${YELLOW}⚠${NC} (HTTP $http_code - Not found, may be expected)"
    ((SKIPPED++))
  else
    echo -e "${RED}✗${NC} (HTTP $http_code)"
    if [ ${#body} -lt 200 ]; then
      echo "  Response: $body"
    fi
    ((FAILED++))
  fi
}

# Health Check
echo "=== Health & Status ==="
test_endpoint "GET" "/health" "" "Health check" false
test_endpoint "GET" "/" "" "Root endpoint" false

# Posts
echo ""
echo "=== Posts ==="
test_endpoint "GET" "/posts/550e8400-e29b-41d4-a716-446655440000" "" "Get post by ID" false
test_endpoint "POST" "/posts" '{"body":"Test post from API test script"}' "Create post" true

# Feed
echo ""
echo "=== Feed ==="
test_endpoint "GET" "/feed" "" "Get home feed" true

# Explore
echo ""
echo "=== Explore ==="
test_endpoint "GET" "/explore/topics" "" "Get topics" false
test_endpoint "GET" "/explore/people" "" "Get people" false
test_endpoint "GET" "/explore/quoted-now" "" "Get quoted now" false
test_endpoint "GET" "/explore/deep-dives" "" "Get deep dives" false
test_endpoint "GET" "/explore/newsroom" "" "Get newsroom" false

# Users
echo ""
echo "=== Users ==="
test_endpoint "GET" "/users/devuser" "" "Get user by handle" false

# Topics
echo ""
echo "=== Topics ==="
test_endpoint "GET" "/topics/test-topic" "" "Get topic by slug" false

# Collections
echo ""
echo "=== Collections ==="
test_endpoint "GET" "/collections" "" "Get collections" true
test_endpoint "POST" "/collections" '{"title":"Test Collection","isPublic":false}' "Create collection" true

# Notifications
echo ""
echo "=== Notifications ==="
test_endpoint "GET" "/notifications" "" "Get notifications" true

# Messages
echo ""
echo "=== Messages ==="
test_endpoint "GET" "/messages/threads" "" "Get message threads" true

# Keeps
echo ""
echo "=== Keeps ==="
test_endpoint "GET" "/keeps" "" "Get keeps" true

# Safety
echo ""
echo "=== Safety ==="
test_endpoint "GET" "/safety/blocked" "" "Get blocked users" true
test_endpoint "GET" "/safety/muted" "" "Get muted users" true

# Search
echo ""
echo "=== Search ==="
test_endpoint "GET" "/search/posts?q=test" "" "Search posts" true

# Summary
echo ""
echo "=========================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
