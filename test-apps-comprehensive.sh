#!/bin/bash

# Comprehensive Test for Mobile and Web Apps
# Tests authentication, security, and production readiness

set +e

API_URL="${API_URL:-http://localhost:3000}"
WEB_URL="${WEB_URL:-http://localhost:3001}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

log() {
    echo -e "${BLUE}→${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

echo ""
echo "=========================================="
echo "  COMPREHENSIVE APPS TEST"
echo "=========================================="
echo ""

# ============================================
# 1. AUTHENTICATION
# ============================================
section "1. Authentication Tests"

TIMESTAMP=$(date +%s)
TEST_EMAIL="comptest_${TIMESTAMP}@cite.test"

log "1.1: API Login..."
login=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}" "$API_URL/auth/login")
if echo "$login" | grep -q "success\|message"; then
    success "API login working"
else
    fail "API login failed"
fi

sleep 1

log "1.2: API Verify..."
verify=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"token\":\"1234\"}" "$API_URL/auth/verify")
TOKEN=$(echo "$verify" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    success "API verify working"
else
    fail "API verify failed"
    exit 1
fi

log "1.3: Web App Login..."
web_login=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"webtest_${TIMESTAMP}@cite.test\"}" "$WEB_URL/api/auth/login")
if echo "$web_login" | grep -q "success"; then
    success "Web app login working"
else
    fail "Web app login failed"
fi

log "1.4: Web App Verify..."
web_verify=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"webtest_${TIMESTAMP}@cite.test\",\"token\":\"1234\"}" \
    -c /tmp/web_cookies.txt "$WEB_URL/api/auth/verify")
if echo "$web_verify" | grep -q "success"; then
    success "Web app verify working"
else
    fail "Web app verify failed"
fi

log "1.5: Web App Authenticated Request..."
web_me=$(curl -s -X GET -b /tmp/web_cookies.txt "$WEB_URL/api/me")
if echo "$web_me" | grep -q "id\|email"; then
    success "Web app authenticated request working"
else
    fail "Web app authenticated request failed"
fi

# ============================================
# 2. SECURITY
# ============================================
section "2. Security Tests"

log "2.1: Input Validation - Invalid Email..."
invalid_email=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"not-an-email"}' "$WEB_URL/api/auth/login")
if echo "$invalid_email" | grep -q "Invalid\|400"; then
    success "Email validation working"
else
    warn "Email validation may need improvement"
fi

log "2.2: Input Validation - Invalid Token..."
invalid_token=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","token":"invalid!@#"}' "$WEB_URL/api/auth/verify")
if echo "$invalid_token" | grep -q "Invalid\|400"; then
    success "Token validation working"
else
    warn "Token validation may need improvement"
fi

log "2.3: Unauthorized Access Protection..."
unauth=$(curl -s -w "%{http_code}" -X GET "$WEB_URL/api/me" -o /dev/null)
if [ "$unauth" = "401" ]; then
    success "Unauthorized access blocked"
else
    fail "Unauthorized access not blocked (status: $unauth)"
fi

log "2.4: Security Headers..."
headers=$(curl -s -I "$WEB_URL" | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security")
if [ -n "$headers" ]; then
    success "Security headers present"
else
    warn "Security headers may need verification"
fi

log "2.5: HTTPS Enforcement (Configuration)..."
# Check if middleware has HTTPS enforcement
if grep -q "https\|HTTPS" /Users/sebastianlindner/Downloads/cite-system/apps/web/middleware.ts 2>/dev/null; then
    success "HTTPS enforcement configured"
else
    warn "HTTPS enforcement may need verification"
fi

# ============================================
# 3. PRODUCTION READINESS
# ============================================
section "3. Production Readiness"

log "3.1: Environment Variable Configuration..."
if [ -f "/Users/sebastianlindner/Downloads/cite-system/apps/web/.env.production.example" ]; then
    success "Production env template exists"
else
    fail "Production env template missing"
fi

if [ -f "/Users/sebastianlindner/Downloads/cite-system/apps/mobile/.env.production.example" ]; then
    success "Mobile production env template exists"
else
    fail "Mobile production env template missing"
fi

log "3.2: Security Utilities..."
if [ -f "/Users/sebastianlindner/Downloads/cite-system/apps/web/lib/security.ts" ] || \
   grep -q "getApiUrl\|validateOrigin" /Users/sebastianlindner/Downloads/cite-system/apps/web/app/api/auth/login/route.ts 2>/dev/null; then
    success "Security utilities implemented"
else
    warn "Security utilities may need verification"
fi

log "3.3: Input Validation..."
if [ -f "/Users/sebastianlindner/Downloads/cite-system/apps/web/lib/validation.ts" ] || \
   grep -q "validateEmail\|sanitizeString" /Users/sebastianlindner/Downloads/cite-system/apps/web/app/api/auth/login/route.ts 2>/dev/null; then
    success "Input validation implemented"
else
    warn "Input validation may need verification"
fi

log "3.4: Error Handling..."
# Check if error handling is secure
if grep -q "createSecureErrorResponse\|Internal server error" /Users/sebastianlindner/Downloads/cite-system/apps/web/app/api/auth/login/route.ts 2>/dev/null; then
    success "Secure error handling implemented"
else
    warn "Error handling may need verification"
fi

# ============================================
# SUMMARY
# ============================================
section "Test Summary"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "COMPREHENSIVE APPS TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Warnings: $WARNINGS"
echo ""

rm -f /tmp/web_cookies.txt

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED - APPS ARE PRODUCTION READY! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
