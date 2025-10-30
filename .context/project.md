# Backend Monorepo

A production-ready monorepo architecture built with Turborepo + pnpm, designed to provide a robust framework for developing and deploying scalable backend applications.

## Overview

This monorepo features a centralized "core" package that provides a solid foundation for all applications, ensuring consistency, maintainability, and rapid development across multiple projects.

### Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js (>=18.0.0)
- **Package Manager:** pnpm (>=8.0.0)
- **Monorepo Tool:** Turborepo 2.1.0
- **Backend Framework:** Express
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Caching:** Redis
- **Real-time:** Socket.io
- **File Storage:** MinIO / Digital Ocean Spaces (S3-compatible)

## Project Structure

```
atriz-backend/
├── packages/
│   └── core/              # Shared framework and utilities
├── apps/
│   ├── website/           # Atriz Website (port 3000)
│   ├── mextrack-api/      # Mextrack API (port 3001)
│   └── pshop-api/         # PShop API (port 3002)
├── scripts/               # Database and maintenance scripts
└── turbo.json            # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL
- Redis (optional, for caching)
- MinIO (optional, for local file storage)

### Installation

```bash
# Install dependencies
pnpm install

# Build framework packages
pnpm build

# Start development
pnpm dev
```

## Available Commands

### Development

```bash
pnpm dev                    # Start all apps in watch mode
pnpm dev:atriz              # Start Atriz Website only (port 3000)
pnpm dev:mextrack           # Start Mextrack API only (port 3001)
pnpm dev:pshop              # Start PShop API only (port 3002)
```

### Building

```bash
pnpm build                  # Build all packages and apps
pnpm build:atriz            # Build Atriz Website app only
pnpm build:mextrack         # Build Mextrack only
pnpm build:pshop            # Build PShop only
```

### Testing

```bash
pnpm test                   # Run all tests
pnpm test:atriz             # Test Atriz Website only
pnpm test:mextrack          # Test Mextrack only
pnpm test:pshop             # Test PShop only
pnpm test:watch             # Watch mode for all tests
pnpm test:coverage          # Run tests with coverage report
```

### Code Quality

```bash
pnpm lint                   # Lint all packages and apps
pnpm lint:fix               # Fix linting issues automatically
pnpm format                 # Format code with Prettier
pnpm format:check           # Check code formatting
pnpm type-check             # Run TypeScript type checking
```

### Database Management

```bash
# Database Creation
pnpm db:create              # Create all databases
pnpm db:create:core         # Create core database only
pnpm db:create:atriz        # Create Atriz database only
pnpm db:create:mextrack     # Create Mextrack database only
pnpm db:create:pshop        # Create PShop database only

# Database Truncation (Clear Tables)
pnpm db:truncate            # Truncate all database tables
pnpm db:truncate:core       # Truncate core tables only
pnpm db:truncate:atriz      # Truncate Atriz tables only
pnpm db:truncate:mextrack   # Truncate Mextrack tables only
pnpm db:truncate:pshop      # Truncate PShop tables only

# Migrations
pnpm db:migrate             # Run all migrations
pnpm db:migrate:core        # Run core migrations only
pnpm db:migrate:atriz       # Run Atriz migrations only
pnpm db:migrate:mextrack    # Run Mextrack migrations only
pnpm db:migrate:pshop       # Run PShop migrations only

# Seeding
pnpm db:seed                # Seed all databases
pnpm db:seed:core           # Seed core database only
pnpm db:seed:atriz          # Seed Atriz database only
pnpm db:seed:mextrack       # Seed Mextrack database only
pnpm db:seed:pshop          # Seed PShop database only
```

### Maintenance

```bash
pnpm clean                  # Clean all dist folders
pnpm clean:cache            # Clear Turborepo cache
```

## Environment Configuration

### Core Environment Variables

Required for all applications using the framework:

```bash
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_POOL_MAX=20
DB_SSL_ENABLED=false  # Set to true in production
```

### File Storage Options

**Option 1: Digital Ocean Spaces / AWS S3 (Production)**

```bash
STORAGE_PROVIDER=s3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your-access-key
DO_SPACES_SECRET=your-secret-key
DO_SPACES_BUCKET=your-bucket-name
```

**Option 2: MinIO (Local Development)**

```bash
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
```

## Architecture

### Core Package

The `@atriz/core` package provides shared functionality for all applications:

- Database connection and pooling
- JWT authentication middleware
- File storage abstraction (MinIO/S3)
- Redis caching utilities
- Socket.io configuration
- Common TypeScript types and utilities
- Error handling
- Logging

### Applications

Each application in the `apps/` directory:

- Runs independently with its own port
- Shares the core framework for consistency
- Maintains its own database schema
- Can be built, tested, and deployed separately

## Development Workflow

1. **Initial Setup:** Run `pnpm install` to install dependencies
2. **Build Core:** Run `pnpm build` to compile shared packages
3. **Database Setup:** Use `pnpm db:create` and `pnpm db:migrate` to set up databases
4. **Start Development:** Use `pnpm dev` or individual app commands
5. **Code Quality:** Run `pnpm lint` and `pnpm type-check` before commits
6. **Testing:** Run `pnpm test` to ensure everything works

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database with SSL (`DB_SSL_ENABLED=true`)
3. Use S3-compatible storage (Digital Ocean Spaces recommended)
4. Set strong JWT secrets
5. Run `pnpm build` to create optimized builds
6. Deploy individual apps as needed

## License

Private - All rights reserved

---

**For AI Agents:** This is a TypeScript monorepo using Turborepo for orchestration. Each app is an Express server with PostgreSQL, JWT auth, and optional Redis/Socket.io/MinIO integration. The core package provides shared utilities. Use pnpm for all package management. Follow the command patterns above for all operations.
