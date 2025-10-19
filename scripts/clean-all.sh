#!/bin/bash

# Mextrack Backends - Clean All Script
# Removes all build artifacts and dependencies

set -e

echo "🧹 Cleaning Mextrack Backends..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  This will remove:${NC}"
echo "  - All node_modules folders"
echo "  - All dist folders"
echo "  - All build artifacts"
echo "  - Turbo cache"
echo ""

read -p "Are you sure? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
echo -e "${GREEN}✓ node_modules removed${NC}"

echo ""
echo "🗑️  Removing dist folders..."
find . -name "dist" -type d -prune -exec rm -rf '{}' +
echo -e "${GREEN}✓ dist folders removed${NC}"

echo ""
echo "🗑️  Removing build artifacts..."
find . -name "*.tsbuildinfo" -type f -delete
echo -e "${GREEN}✓ Build artifacts removed${NC}"

echo ""
echo "🗑️  Cleaning Turbo cache..."
rm -rf .turbo
echo -e "${GREEN}✓ Turbo cache cleaned${NC}"

echo ""
echo "🗑️  Cleaning pnpm store..."
pnpm store prune || true
echo -e "${GREEN}✓ pnpm store cleaned${NC}"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To reinstall and rebuild:"
echo "  pnpm install"
echo "  pnpm build"
