#!/bin/bash

# Frontend Coverage Test Script
# Tests that all backend endpoints are covered by mobile and web apps

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Frontend Coverage Analysis${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Define all backend endpoints (endpoint|pattern)
ENDPOINTS=(
    "POST /auth/login|auth/login"
    "POST /auth/verify|auth/verify"
    "GET /auth/me|auth/me"
    "GET /users/me|users/me"
    "PATCH /users/me|users/me"
    "DELETE /users/me|users/me"
    "GET /users/me/export|users/me/export"
    "GET /users/suggested|users/suggested"
    "GET /users/:handle|users/"
    "POST /users/:id/follow|users/.*follow"
    "DELETE /users/:id/follow|users/.*follow"
    "GET /users/:id/replies|users/.*replies"
    "GET /users/:id/quotes|users/.*quotes"
    "POST /posts|posts"
    "GET /posts/:id|posts/"
    "DELETE /posts/:id|posts/"
    "POST /posts/:id/like|posts/.*like"
    "POST /posts/:id/keep|posts/.*keep"
    "POST /posts/:id/view|posts/.*view"
    "POST /posts/:id/read-time|posts/.*read-time"
    "POST /posts/:id/quote|posts/.*quote|posts/quote"
    "GET /posts/:id/sources|posts/.*sources"
    "GET /posts/:id/referenced-by|posts/.*referenced-by"
    "GET /posts/:id/replies|posts/.*replies"
    "POST /posts/:postId/replies|posts/.*replies"
    "DELETE /posts/:postId/replies/:id|posts/.*replies"
    "GET /feed|feed"
    "GET /explore/topics|explore/topics"
    "GET /explore/people|explore/people"
    "GET /explore/quoted-now|explore/quoted-now"
    "GET /explore/deep-dives|explore/deep-dives"
    "GET /explore/newsroom|explore/newsroom"
    "GET /topics/:slug|topics/"
    "POST /topics/:slug/follow|topics/.*follow"
    "DELETE /topics/:slug/follow|topics/.*follow"
    "GET /search/posts|search/posts"
    "GET /search/users|search/users"
    "POST /collections|collections"
    "GET /collections|collections"
    "GET /collections/:id|collections/"
    "PATCH /collections/:id|collections/"
    "POST /collections/:id/items|collections/.*items"
    "DELETE /collections/:id/items/:itemId|collections/.*items"
    "GET /keeps|keeps"
    "GET /messages/threads|messages/threads"
    "POST /messages/threads|messages/threads"
    "GET /messages/threads/:threadId/messages|messages/threads/.*messages"
    "POST /messages/threads/:threadId/messages|messages/threads/.*messages"
    "GET /notifications|notifications"
    "POST /notifications/:id/read|notifications/.*read"
    "POST /notifications/read-all|notifications/read-all"
    "POST /safety/block/:userId|safety/block"
    "DELETE /safety/block/:userId|safety/block"
    "POST /safety/mute/:userId|safety/mute"
    "DELETE /safety/mute/:userId|safety/mute"
    "GET /safety/blocked|safety/blocked"
    "GET /safety/muted|safety/muted"
    "POST /safety/report|safety/report"
    "POST /upload/header-image|upload/header-image"
    "GET /invites/my|invites/my"
    "POST /invites/generate|invites/generate"
    "POST /admin/invites/system|admin/invites/system"
    "POST /admin/beta-mode|admin/beta-mode"
    "POST /waiting-list|waiting-list"
    "GET /health|health"
)

# Check if endpoint is used in mobile app
check_mobile() {
    local pattern=$1
    
    # Search in mobile app
    if grep -r "api\.\(get\|post\|put\|patch\|delete\)" "$PROJECT_ROOT/apps/mobile" 2>/dev/null | grep -qE "$pattern"; then
        return 0
    fi
    
    # Also check for direct fetch calls
    if grep -r "fetch.*$pattern" "$PROJECT_ROOT/apps/mobile" 2>/dev/null | grep -qE "$pattern"; then
        return 0
    fi
    
    return 1
}

# Check if endpoint is used in web app
check_web() {
    local pattern=$1
    
    # Search in web app API routes
    if find "$PROJECT_ROOT/apps/web/app/api" -type f -name "*.ts" 2>/dev/null | xargs grep -lE "$pattern" >/dev/null 2>&1; then
        return 0
    fi
    
    # Also check for direct fetch calls in pages
    if grep -rE "fetch.*$pattern|/api/$pattern" "$PROJECT_ROOT/apps/web/app" 2>/dev/null | grep -qE "$pattern"; then
        return 0
    fi
    
    return 1
}

# Counters
TOTAL=0
MOBILE_COVERED=0
WEB_COVERED=0
BOTH_COVERED=0
NEITHER_COVERED=0

declare -a MOBILE_MISSING=()
declare -a WEB_MISSING=()
declare -a NEITHER_MISSING=()

echo -e "${CYAN}Analyzing endpoint coverage...${NC}\n"

# Check each endpoint
for endpoint_data in "${ENDPOINTS[@]}"; do
    IFS='|' read -r endpoint pattern <<< "$endpoint_data"
    ((TOTAL++))
    
    mobile_covered=false
    web_covered=false
    
    if check_mobile "$pattern"; then
        mobile_covered=true
        ((MOBILE_COVERED++))
    fi
    
    if check_web "$pattern"; then
        web_covered=true
        ((WEB_COVERED++))
    fi
    
    if [ "$mobile_covered" = true ] && [ "$web_covered" = true ]; then
        ((BOTH_COVERED++))
        echo -e "${GREEN}✓${NC} $endpoint ${CYAN}(both)${NC}"
    elif [ "$mobile_covered" = true ]; then
        echo -e "${YELLOW}⚠${NC} $endpoint ${YELLOW}(mobile only)${NC}"
        WEB_MISSING+=("$endpoint")
    elif [ "$web_covered" = true ]; then
        echo -e "${YELLOW}⚠${NC} $endpoint ${YELLOW}(web only)${NC}"
        MOBILE_MISSING+=("$endpoint")
    else
        ((NEITHER_COVERED++))
        echo -e "${RED}✗${NC} $endpoint ${RED}(missing)${NC}"
        NEITHER_MISSING+=("$endpoint")
    fi
done

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Coverage Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

if [ $TOTAL -gt 0 ]; then
    MOBILE_PERCENT=$((MOBILE_COVERED * 100 / TOTAL))
    WEB_PERCENT=$((WEB_COVERED * 100 / TOTAL))
    BOTH_PERCENT=$((BOTH_COVERED * 100 / TOTAL))
    
    echo -e "Total Endpoints: ${TOTAL}"
    echo -e "${GREEN}Both Apps: ${BOTH_COVERED} (${BOTH_PERCENT}%)${NC}"
    echo -e "${YELLOW}Mobile Only: $((MOBILE_COVERED - BOTH_COVERED))${NC}"
    echo -e "${YELLOW}Web Only: $((WEB_COVERED - BOTH_COVERED))${NC}"
    echo -e "${RED}Missing: ${NEITHER_COVERED}${NC}"
    echo ""
    
    echo -e "Mobile Coverage: ${MOBILE_COVERED}/${TOTAL} (${MOBILE_PERCENT}%)"
    echo -e "Web Coverage: ${WEB_COVERED}/${TOTAL} (${WEB_PERCENT}%)"
else
    echo -e "${RED}No endpoints found!${NC}"
fi

# Missing endpoints
if [ ${#MOBILE_MISSING[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}⚠ Missing in Mobile App:${NC}"
    for endpoint in "${MOBILE_MISSING[@]}"; do
        echo -e "  ${YELLOW}✗${NC} $endpoint"
    done
fi

if [ ${#WEB_MISSING[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}⚠ Missing in Web App:${NC}"
    for endpoint in "${WEB_MISSING[@]}"; do
        echo -e "  ${YELLOW}✗${NC} $endpoint"
    done
fi

if [ ${#NEITHER_MISSING[@]} -gt 0 ]; then
    echo -e "\n${RED}✗ Missing in Both Apps:${NC}"
    for endpoint in "${NEITHER_MISSING[@]}"; do
        echo -e "  ${RED}✗${NC} $endpoint"
    done
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Final status
if [ $NEITHER_COVERED -eq 0 ] && [ ${#MOBILE_MISSING[@]} -eq 0 ] && [ ${#WEB_MISSING[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All endpoints are covered by both frontends!${NC}"
    exit 0
elif [ $NEITHER_COVERED -eq 0 ]; then
    echo -e "${YELLOW}⚠ Some endpoints are missing in one app, but all are covered by at least one.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some endpoints are missing in both apps!${NC}"
    exit 1
fi
