#!/bin/bash

# Mextrack Backends - Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 Mextrack Backends - Setup Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version is too old (need 20+, have $NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠ pnpm is not installed. Installing...${NC}"
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
if [ "$PNPM_VERSION" -lt 8 ]; then
    echo -e "${RED}❌ pnpm version is too old (need 8+, have $PNPM_VERSION)${NC}"
    echo "Run: npm install -g pnpm"
    exit 1
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL 15+ from https://postgresql.org"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL installed${NC}"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL server"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🗄️ Setting up databases..."

# Create development database
if psql -lqt | cut -d \| -f 1 | grep -qw mextrack_dev; then
    echo -e "${YELLOW}⚠ mextrack_dev already exists${NC}"
else
    createdb mextrack_dev
    echo -e "${GREEN}✓ Created mextrack_dev${NC}"
fi

# Create test database
if psql -lqt | cut -d \| -f 1 | grep -qw mextrack_test; then
    echo -e "${YELLOW}⚠ mextrack_test already exists${NC}"
else
    createdb mextrack_test
    echo -e "${GREEN}✓ Created mextrack_test${NC}"
fi

echo ""
echo "⚙️ Configuring environment..."

# Setup Mextrack .env
if [ ! -f "apps/mextrack/.env" ]; then
    cp apps/mextrack/.env.example apps/mextrack/.env
    echo -e "${GREEN}✓ Created apps/mextrack/.env${NC}"
    echo -e "${YELLOW}⚠ Please update DATABASE_URL in apps/mextrack/.env${NC}"
else
    echo -e "${YELLOW}⚠ apps/mextrack/.env already exists${NC}"
fi

# Setup PShop .env
if [ ! -f "apps/pshop/.env" ]; then
    cp apps/pshop/.env.example apps/pshop/.env
    echo -e "${GREEN}✓ Created apps/pshop/.env${NC}"
    echo -e "${YELLOW}⚠ Please update DATABASE_URL in apps/pshop/.env${NC}"
else
    echo -e "${YELLOW}⚠ apps/pshop/.env already exists${NC}"
fi

echo ""
read -p "Have you configured the DATABASE_URL in .env files? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please configure DATABASE_URL and run this script again${NC}"
    exit 0
fi

echo ""
echo "🔄 Running migrations..."
pnpm db:migrate

echo ""
echo "🌱 Seeding development data..."
pnpm db:seed

echo ""
echo "🏗️ Building packages..."
pnpm build

echo ""
echo "🧪 Running tests..."
pnpm test

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Review .env files and update if needed"
echo "  2. Start development: pnpm dev"
echo "  3. Check health: curl http://localhost:3001/health"
echo "  4. Read GETTING_STARTED.md for more information"
echo ""
echo "🎉 Happy coding!"
