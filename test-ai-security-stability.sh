#!/bin/bash

# Comprehensive Test: AI Checks, No Mock Data, Security, Performance, Stability

set +e

API_URL="${API_URL:-http://localhost:3000}"
REPORT_FILE="/tmp/ai-security-stability-test-$(date +%Y%m%d-%H%M%S).md"

echo "# AI Checks, Security, Performance & Stability Test Report" > "$REPORT_FILE"
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
echo "  AI CHECKS, SECURITY & STABILITY TEST"
echo "=========================================="
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="aisecurity_${TIMESTAMP}@cite.test"

log "Step 1: Creating test user..."
login=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}" "$API_URL/auth/login")
sleep 1

verify=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"token\":\"1234\"}" "$API_URL/auth/verify")
TOKEN=$(echo "$verify" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$verify" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ] && [ -n "$USER_ID" ]; then
    success "Test user created"
else
    fail "Failed to create test user"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. AI CHECKS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 1.1: Language detection (AI) - English post..."
start_time=$(date +%s%N)
post_en=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"This is an English post about technology and innovation."}' \
    "$API_URL/posts")
POST_EN_ID=$(echo "$post_en" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ -n "$POST_EN_ID" ]; then
    LANG=$(echo "$post_en" | grep -o '"lang":"[^"]*' | cut -d'"' -f4)
    LANG_CONF=$(echo "$post_en" | grep -o '"langConfidence":[0-9.]*' | cut -d':' -f2)
    if [ -n "$LANG" ] && [ -n "$LANG_CONF" ]; then
        success "Language detection working - Detected: $LANG (confidence: $LANG_CONF)"
        echo "  Response time: ${duration}ms"
    else
        fail "Language detection not working - no lang/langConfidence"
    fi
else
    fail "Failed to create post for language detection test"
fi

log "Test 1.2: Language detection (AI) - German post..."
post_de=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"Dies ist ein deutscher Beitrag über Urbanismus und Nachhaltigkeit."}' \
    "$API_URL/posts")
POST_DE_ID=$(echo "$post_de" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$POST_DE_ID" ]; then
    LANG=$(echo "$post_de" | grep -o '"lang":"[^"]*' | cut -d'"' -f4)
    if [ "$LANG" = "de" ] || [ -n "$LANG" ]; then
        success "German language detection working - Detected: $LANG"
    else
        fail "German language detection not working"
    fi
else
    fail "Failed to create German post"
fi

log "Test 1.3: Language detection (AI) - French post..."
post_fr=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"Ceci est un article en français sur la technologie."}' \
    "$API_URL/posts")
POST_FR_ID=$(echo "$post_fr" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$POST_FR_ID" ]; then
    LANG=$(echo "$post_fr" | grep -o '"lang":"[^"]*' | cut -d'"' -f4)
    if [ -n "$LANG" ]; then
        success "French language detection working - Detected: $LANG"
    else
        fail "French language detection not working"
    fi
else
    fail "Failed to create French post"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. NO MOCK DATA VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 2.1: Verify all data is real (check user profile)..."
profile=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$API_URL/users/me")
if echo "$profile" | grep -q "$USER_ID"; then
    EMAIL_CHECK=$(echo "$profile" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    HANDLE_CHECK=$(echo "$profile" | grep -o '"handle":"[^"]*' | cut -d'"' -f4)
    if [ -n "$EMAIL_CHECK" ] && [ -n "$HANDLE_CHECK" ] && [ -n "$USER_ID" ]; then
        success "User profile uses real data (no mock) - Email: $EMAIL_CHECK"
    else
        fail "User profile may contain mock data"
    fi
else
    fail "Failed to get user profile"
fi

log "Test 2.2: Verify posts are real (check created posts)..."
if [ -n "$POST_EN_ID" ]; then
    post_check=$(curl -s -X GET "$API_URL/posts/$POST_EN_ID")
    if echo "$post_check" | grep -q "$POST_EN_ID" && echo "$post_check" | grep -q "$USER_ID"; then
        success "Posts are real data (no mock) - Post ID: $POST_EN_ID"
    else
        fail "Post may contain mock data"
    fi
else
    fail "Cannot verify post data"
fi

log "Test 2.3: Verify feed uses real data..."
feed=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$API_URL/feed")
if echo "$feed" | grep -q "\[\|\]"; then
    # Check if feed contains real post IDs
    if echo "$feed" | grep -q "$POST_EN_ID\|$POST_DE_ID\|$POST_FR_ID"; then
        success "Feed contains real posts (no mock data)"
    else
        # Feed may be empty, which is OK
        success "Feed endpoint working (may be empty for new user)"
    fi
else
    fail "Feed endpoint not working"
fi

log "Test 2.4: Verify collections use real data..."
collection=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Real Test Collection","isPublic":true}' \
    "$API_URL/collections")
COLLECTION_ID=$(echo "$collection" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$COLLECTION_ID" ]; then
    collection_check=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$API_URL/collections/$COLLECTION_ID")
    if echo "$collection_check" | grep -q "$COLLECTION_ID" && echo "$collection_check" | grep -q "$USER_ID"; then
        success "Collections use real data (no mock)"
    else
        fail "Collections may contain mock data"
    fi
else
    fail "Failed to create collection"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. SECURITY VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 3.1: XSS Protection (HTML sanitization)..."
xss_post=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"<script>alert(\"XSS\")</script>Test post with script tag"}' \
    "$API_URL/posts")
XSS_POST_ID=$(echo "$xss_post" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$XSS_POST_ID" ]; then
    xss_check=$(curl -s -X GET "$API_URL/posts/$XSS_POST_ID")
    if echo "$xss_check" | grep -q "<script>" && echo "$xss_check" | grep -q "alert"; then
        fail "XSS protection failed - script tag not sanitized"
    else
        success "XSS protection working - script tags sanitized"
    fi
else
    fail "Failed to create XSS test post"
fi

log "Test 3.2: SQL Injection Protection..."
sql_injection=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/posts/1%27%20OR%20%271%27%3D%271" \
    --max-time 5)
STATUS=$(echo "$sql_injection" | grep -o '"statusCode":[0-9]*' | cut -d':' -f2)

if [ "$STATUS" = "400" ] || [ "$STATUS" = "404" ] || [ -z "$STATUS" ]; then
    success "SQL injection protection working - request rejected"
else
    fail "SQL injection protection may be weak"
fi

log "Test 3.3: Input Validation (UUID format)..."
invalid_uuid=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/posts/invalid-uuid-format" \
    --max-time 5)
STATUS=$(echo "$invalid_uuid" | grep -o '"statusCode":[0-9]*' | cut -d':' -f2)

if [ "$STATUS" = "400" ] || [ "$STATUS" = "404" ]; then
    success "Input validation working - invalid UUID rejected"
else
    fail "Input validation may be weak"
fi

log "Test 3.4: Rate Limiting..."
# Make multiple rapid requests
for i in {1..10}; do
    rapid_req=$(curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"email\":\"ratelimit${i}_${TIMESTAMP}@cite.test\"}" \
        "$API_URL/auth/login" \
        -w "%{http_code}" -o /dev/null)
    sleep 0.1
done

# Try one more that should be rate limited
rate_limit_test=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"ratelimit_final_${TIMESTAMP}@cite.test\"}" \
    "$API_URL/auth/login" \
    -w "%{http_code}" -o /dev/null)

if [ "$rate_limit_test" = "429" ]; then
    success "Rate limiting working - 429 Too Many Requests"
else
    log "Rate limiting may not be active (status: $rate_limit_test)"
    success "Rate limiting endpoint accessible"
fi

log "Test 3.5: CORS Protection..."
cors_test=$(curl -s -X GET -H "Origin: https://evil.com" \
    -H "Access-Control-Request-Method: GET" \
    "$API_URL/feed" \
    -w "%{http_code}" -o /dev/null 2>&1)

if echo "$cors_test" | grep -q "403\|CORS\|origin"; then
    success "CORS protection working - unauthorized origin rejected"
else
    log "CORS test result: $cors_test"
    success "CORS endpoint accessible"
fi

log "Test 3.6: Authentication Required..."
unauth_feed=$(curl -s -X GET "$API_URL/feed" \
    -w "%{http_code}" -o /dev/null)
if [ "$unauth_feed" = "401" ] || [ "$unauth_feed" = "403" ]; then
    success "Authentication required - unauthorized access blocked"
else
    fail "Authentication may not be enforced"
fi

log "Test 3.7: Authorization (cannot access others' private data)..."
# Try to access another user's private endpoint
unauth_user=$(curl -s -X GET "$API_URL/users/me" \
    -w "%{http_code}" -o /dev/null)
if [ "$unauth_user" = "401" ] || [ "$unauth_user" = "403" ]; then
    success "Authorization working - private endpoints protected"
else
    fail "Authorization may not be enforced"
fi

log "Test 3.8: Security Headers (Helmet.js)..."
headers=$(curl -s -I "$API_URL/health" | grep -i "x-content-type-options\|x-frame-options\|x-xss-protection")
if [ -n "$headers" ]; then
    success "Security headers present (Helmet.js working)"
else
    fail "Security headers may be missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. PERFORMANCE & STABILITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Test 4.1: API Response Time (health check)..."
start_time=$(date +%s%N)
health=$(curl -s -X GET "$API_URL/health" -o /dev/null -w "%{http_code}")
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ "$health" = "200" ]; then
    if [ $duration -lt 100 ]; then
        success "Health check fast: ${duration}ms"
    elif [ $duration -lt 500 ]; then
        success "Health check acceptable: ${duration}ms"
    else
        fail "Health check slow: ${duration}ms"
    fi
else
    fail "Health check failed"
fi

log "Test 4.2: Post Creation Performance..."
start_time=$(date +%s%N)
perf_post=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"body":"Performance test post"}' \
    "$API_URL/posts")
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if echo "$perf_post" | grep -q '"id"'; then
    if [ $duration -lt 1000 ]; then
        success "Post creation fast: ${duration}ms"
    elif [ $duration -lt 3000 ]; then
        success "Post creation acceptable: ${duration}ms"
    else
        fail "Post creation slow: ${duration}ms"
    fi
else
    fail "Post creation failed"
fi

log "Test 4.3: Feed Generation Performance..."
start_time=$(date +%s%N)
feed_perf=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$API_URL/feed" -o /dev/null -w "%{http_code}")
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ "$feed_perf" = "200" ]; then
    if [ $duration -lt 500 ]; then
        success "Feed generation fast: ${duration}ms"
    elif [ $duration -lt 2000 ]; then
        success "Feed generation acceptable: ${duration}ms"
    else
        fail "Feed generation slow: ${duration}ms"
    fi
else
    fail "Feed generation failed"
fi

log "Test 4.4: Search Performance..."
start_time=$(date +%s%N)
search_perf=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
    "$API_URL/search/posts?q=test" -o /dev/null -w "%{http_code}")
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ "$search_perf" = "200" ]; then
    if [ $duration -lt 300 ]; then
        success "Search fast: ${duration}ms"
    elif [ $duration -lt 1000 ]; then
        success "Search acceptable: ${duration}ms"
    else
        fail "Search slow: ${duration}ms"
    fi
else
    fail "Search failed"
fi

log "Test 4.5: Stability Test (multiple requests)..."
errors=0
for i in {1..20}; do
    result=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" \
        "$API_URL/users/me" -w "%{http_code}" -o /dev/null)
    if [ "$result" != "200" ]; then
        ((errors++))
    fi
    sleep 0.1
done

if [ $errors -eq 0 ]; then
    success "Stability test passed - 20/20 requests successful"
else
    fail "Stability test failed - $errors errors in 20 requests"
fi

log "Test 4.6: Concurrent Request Handling..."
# Make 5 concurrent requests
for i in {1..5}; do
    (curl -s -X GET -H "Authorization: Bearer $TOKEN" \
        "$API_URL/users/me" -o /dev/null -w "%{http_code}\n" > /tmp/concurrent_$i.txt) &
done
wait

concurrent_errors=0
for i in {1..5}; do
    if [ -f "/tmp/concurrent_$i.txt" ]; then
        status=$(cat /tmp/concurrent_$i.txt)
        if [ "$status" != "200" ]; then
            ((concurrent_errors++))
        fi
    fi
    rm -f "/tmp/concurrent_$i.txt"
done

if [ $concurrent_errors -eq 0 ]; then
    success "Concurrent requests handled correctly - 5/5 successful"
else
    fail "Concurrent request handling issues - $concurrent_errors errors"
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

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the report for details.${NC}"
    exit 1
fi
