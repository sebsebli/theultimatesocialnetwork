#!/bin/bash

# API Test Script for Citewalk System
# Tests all API endpoints to ensure they're working

API_URL="${API_URL:-http://localhost:3000}"
DEV_TOKEN="${DEV_TOKEN:-}"

echo "🧪 Testing Citewalk API endpoints..."
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -n "Testing $description... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $DEV_TOKEN" "$API_URL$endpoint")
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Authorization: Bearer $DEV_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint")
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
      -H "Authorization: Bearer $DEV_TOKEN" \
      "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓${NC} (HTTP $http_code)"
    ((PASSED++))
  elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
    echo -e "${YELLOW}⚠${NC} (HTTP $http_code - Auth required, skipping)"
  else
    echo -e "${RED}✗${NC} (HTTP $http_code)"
    echo "  Response: $body"
    ((FAILED++))
  fi
}

# Health check
echo "=== Health Check ==="
test_endpoint "GET" "/health" "" "Health check"

# Posts
echo ""
echo "=== Posts ==="
test_endpoint "GET" "/posts/550e8400-e29b-41d4-a716-446655440000" "" "Get post"
test_endpoint "POST" "/posts" '{"body":"Test post from API test"}' "Create post"

# Feed
echo ""
echo "=== Feed ==="
test_endpoint "GET" "/feed" "" "Get home feed"

# Explore
echo ""
echo "=== Explore ==="
test_endpoint "GET" "/explore/topics" "" "Get topics"
test_endpoint "GET" "/explore/people" "" "Get people"
test_endpoint "GET" "/explore/quoted-now" "" "Get quoted now"
test_endpoint "GET" "/explore/deep-dives" "" "Get deep dives"
test_endpoint "GET" "/explore/newsroom" "" "Get newsroom"

# Users
echo ""
echo "=== Users ==="
test_endpoint "GET" "/users/devuser" "" "Get user by handle"

# Topics
echo ""
echo "=== Topics ==="
test_endpoint "GET" "/topics/test-topic" "" "Get topic"

# Collections
echo ""
echo "=== Collections ==="
test_endpoint "GET" "/collections" "" "Get collections"

# Notifications
echo ""
echo "=== Notifications ==="
test_endpoint "GET" "/notifications" "" "Get notifications"

# Messages
echo ""
echo "=== Messages ==="
test_endpoint "GET" "/messages/threads" "" "Get message threads"

# Keeps
echo ""
echo "=== Keeps ==="
test_endpoint "GET" "/keeps" "" "Get keeps"

# Safety
echo ""
echo "=== Safety ==="
test_endpoint "GET" "/safety/blocked" "" "Get blocked users"
test_endpoint "GET" "/safety/muted" "" "Get muted users"

# Search
echo ""
echo "=== Search ==="
test_endpoint "GET" "/search/posts?q=test" "" "Search posts"

# Summary
echo ""
echo "=========================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
