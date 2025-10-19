#!/bin/bash

# Mextrack Backends - Development Health Check
# Verifies that everything is working correctly

set -e

echo "🔍 Mextrack Backends - Development Health Check"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Function to check and report
check() {
    if $1; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📋 Checking environment..."
check "command -v node &> /dev/null" "Node.js installed"
check "command -v pnpm &> /dev/null" "pnpm installed"
check "command -v psql &> /dev/null" "PostgreSQL installed"
check "pg_isready &> /dev/null" "PostgreSQL running"

echo ""
echo "📁 Checking files..."
check "[ -f package.json ]" "package.json exists"
check "[ -f turbo.json ]" "turbo.json exists"
check "[ -f pnpm-workspace.yaml ]" "pnpm-workspace.yaml exists"
check "[ -d node_modules ]" "Dependencies installed"
check "[ -f apps/mextrack/.env ]" "Mextrack .env exists"
check "[ -f apps/pshop/.env ]" "PShop .env exists"

echo ""
echo "🗄️ Checking databases..."
check "psql -lqt | cut -d \| -f 1 | grep -qw mextrack_dev" "mextrack_dev database exists"
check "psql -lqt | cut -d \| -f 1 | grep -qw mextrack_test" "mextrack_test database exists"

# Check if migrations have run
if psql mextrack_dev -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='migrations')" | grep -q t; then
    MIGRATION_COUNT=$(psql mextrack_dev -tAc "SELECT COUNT(*) FROM migrations")
    check "[ $MIGRATION_COUNT -ge 3 ]" "Migrations executed ($MIGRATION_COUNT/3)"
else
    echo -e "${RED}✗ Migrations not executed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if users exist
if psql mextrack_dev -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='users')" | grep -q t; then
    USER_COUNT=$(psql mextrack_dev -tAc "SELECT COUNT(*) FROM users")
    check "[ $USER_COUNT -gt 0 ]" "Test users seeded ($USER_COUNT users)"
else
    echo -e "${RED}✗ Users table doesn't exist${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🔨 Checking build..."
check "[ -d apps/mextrack/dist ]" "Mextrack built"
check "[ -d apps/pshop/dist ]" "PShop built"

echo ""
echo "🧪 Running tests..."
if pnpm test &> /dev/null; then
    echo -e "${GREEN}✓ All tests pass${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📝 Running type check..."
if pnpm type-check &> /dev/null; then
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
else
    echo -e "${RED}✗ TypeScript errors found${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🎨 Running linter..."
if pnpm lint &> /dev/null; then
    echo -e "${GREEN}✓ No linting errors${NC}"
else
    echo -e "${RED}✗ Linting errors found${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Environment is healthy.${NC}"
    echo ""
    echo "You can start development with: pnpm dev"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed!${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    echo "Refer to GETTING_STARTED.md for help."
    exit 1
fi
