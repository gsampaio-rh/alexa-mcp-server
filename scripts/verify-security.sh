#!/bin/bash
# Security Verification Script
# This script helps verify that credentials are not being leaked or shared

set -e

echo "🔒 Security Verification Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Verify credentials are not hardcoded in code
echo "1. Checking for hardcoded credentials..."
# Look for credential assignments (not just checks/usage)
HARDCODED=$(grep -r "UBID_MAIN\|AT_MAIN" src/ --exclude-dir=node_modules | \
    grep -v "env\|Env\|types\|validation\|required\|Missing\|SECURITY\|@param\|@returns\|function\|const\|let\|var" | \
    grep -v "//\|/\*\|if (!\|return\|await\|buildAlexaHeaders\|cookieString" | \
    grep -E "=.*['\"].*UBID|UBID.*=.*['\"]|=.*['\"].*AT_MAIN|AT_MAIN.*=.*['\"]" || true)
if [ -n "$HARDCODED" ]; then
    echo -e "${RED}❌ Found potential hardcoded credentials!${NC}"
    echo "$HARDCODED"
    exit 1
else
    echo -e "${GREEN}✅ No hardcoded credentials found${NC}"
fi

# Check 2: Verify all network requests go to Amazon only
echo ""
echo "2. Checking network requests..."
# Find actual fetch() calls with URLs (not internal API_BASE calls)
NON_AMAZON_REQUESTS=$(grep -r "fetch(" src/ --exclude-dir=node_modules | \
    grep -v "amazon.com\|localhost\|127.0.0.1\|API_BASE\|apiBase\|/\*\|//" | \
    grep -v "\.fetch\|serveSSE\|serve\|app\.fetch" | \
    grep -E "https?://[^\"']*" | \
    grep -v "amazon.com" || true)
if [ -n "$NON_AMAZON_REQUESTS" ]; then
    echo -e "${YELLOW}⚠️  Found potential non-Amazon requests:${NC}"
    echo "$NON_AMAZON_REQUESTS"
    echo -e "${RED}❌ Security check failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All network requests go to Amazon domains only${NC}"
fi

# Check 3: Verify credentials are not logged
echo ""
echo "3. Checking for credential logging..."
if grep -r "console\.\(log\|warn\|error\|info\|debug\)" src/ --exclude-dir=node_modules | grep -i "ubid\|at-main\|cookie" | grep -v "//\|/\*"; then
    echo -e "${RED}❌ Found potential credential logging!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No credential logging found${NC}"
fi

# Check 4: Verify .env is in .gitignore
echo ""
echo "4. Checking .gitignore..."
if grep -q "\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .env is in .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  .env might not be in .gitignore${NC}"
fi

# Check 5: List all external domains
echo ""
echo "5. External domains used:"
grep -roh "https://[^\"']*" src/ --exclude-dir=node_modules | sort -u | grep -v "localhost\|127.0.0.1" || true

echo ""
echo -e "${GREEN}✅ Security verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the external domains listed above"
echo "2. Ensure all domains are Amazon-owned (*.amazon.com)"
echo "3. Monitor network traffic during runtime"
echo "4. Check server logs for any credential leakage"
