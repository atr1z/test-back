# Mextrack Backends

Multi-service backend repository for Mextrack (fleet tracking) and PShop (point of sale) using Turborepo.

## 🏗️ Architecture

- **Turborepo Monorepo**: Efficient build system and caching
- **Shared Packages**: Reusable code across services (auth, database, types, utils)
- **Independent Services**: Mextrack and PShop APIs
- **Package Manager**: pnpm
- **Database**: PostgreSQL with custom migration system
- **Auth**: Lucia Auth with session management
- **Testing**: Vitest for unit and integration tests

## 📦 Project Structure

```
mextrack-backends/
├── apps/                    # Application services
│   ├── mextrack/           # Fleet tracking API (Port 3001)
│   └── pshop/              # Point of sale API (Port 3002)
├── packages/               # Shared packages
│   ├── auth/              # Authentication (Lucia)
│   ├── database/          # DB client, migrations, seeds
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── .cascade/              # Windsurf rules and context
└── .github/               # CI/CD workflows
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- PostgreSQL >= 15

### Installation

```bash
# Install dependencies
pnpm install

# Setup database
createdb mextrack_dev

# Run migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start all services
pnpm dev
```

## 📋 Available Commands

### Development
```bash
pnpm dev                  # Start all services
pnpm dev:mextrack        # Start Mextrack API only
pnpm dev:pshop           # Start PShop API only
```

### Building
```bash
pnpm build               # Build all services
pnpm build:mextrack      # Build Mextrack API
pnpm build:pshop         # Build PShop API
```

### Database
```bash
pnpm db:migrate          # Run migrations
pnpm db:migrate:create   # Create new migration
pnpm db:rollback         # Rollback last migration
pnpm db:seed             # Run development seeds
pnpm db:seed:prod        # Run production seeds
pnpm db:reset            # Reset database (dev only)
```

### Testing
```bash
pnpm test                # Run all tests
pnpm test:watch          # Run tests in watch mode
pnpm test:coverage       # Run tests with coverage
pnpm test:mextrack       # Test only Mextrack
pnpm test:pshop          # Test only PShop
```

### Code Quality
```bash
pnpm lint                # Run linter
pnpm lint:fix            # Fix linting issues
pnpm format              # Format code
pnpm format:check        # Check formatting
pnpm type-check          # TypeScript type checking
```

### Maintenance
```bash
pnpm clean               # Clean all dist folders and node_modules
pnpm clean:cache         # Clear Turborepo cache
```

## 🔐 Environment Variables

Copy `.env.example` files in each service and configure:

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - development | test | production
- `PORT` - Service port number
- `CORS_ORIGIN` - Allowed origin for CORS
- `LOG_LEVEL` - debug | info | warn | error
- `JWT_SECRET` - Secret for JWT tokens
- `SESSION_SECRET` - Secret for sessions

### Example
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mextrack_dev
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

## 📡 API Documentation

### Mextrack API (Port 3001)

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

#### Vehicles
- `GET /api/vehicles` - List vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

#### Tracking
- `GET /api/tracking/:vehicleId` - Get tracking data
- `POST /api/tracking/:vehicleId` - Add tracking data

### PShop API (Port 3002)

Coming soon - Basic structure implemented.

## 🧪 Testing Strategy

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API endpoints with real database
- **Coverage Target**: Minimum 80% for critical code
- **Test Database**: Separate database for testing

## 🚢 Deployment

### Build Commands
```bash
# Mextrack
cd apps/mextrack && pnpm install && pnpm build

# PShop
cd apps/pshop && pnpm install && pnpm build
```

### Start Commands
```bash
# Both services
node dist/index.js
```

### Dokploy Configuration
- **Build Command**: `pnpm install && pnpm build:{service}`
- **Start Command**: `node dist/index.js`
- **Working Directory**: `apps/{service}`

## 🔧 Tech Stack

### Core
- **Node.js** - Runtime
- **TypeScript** - Language
- **Express** - Web framework
- **PostgreSQL** - Database
- **Turborepo** - Build system

### Authentication
- **Lucia** - Auth library
- **@node-rs/argon2** - Password hashing

### Database
- **postgres** - PostgreSQL client
- Custom migration system

### Validation & Types
- **Zod** - Schema validation
- **TypeScript** - Static typing

### Testing
- **Vitest** - Test framework
- **Supertest** - HTTP testing

### Utilities
- **Winston** - Logging
- **nanoid** - ID generation
- **dotenv** - Environment variables

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes with tests
3. Ensure all tests pass: `pnpm test`
4. Ensure no linting errors: `pnpm lint`
5. Create a pull request to `develop`

### Commit Convention
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Example: feat(mextrack): add vehicle tracking endpoint
```

## 📚 Documentation

- **`.cascade/rules.md`** - Project rules and guidelines
- **`.cascade/context.md`** - Quick reference and patterns
- **`apps/*/README.md`** - Service-specific documentation

## 🐛 Troubleshooting

### Package not found
```bash
pnpm install
```

### Database connection fails
Check `DATABASE_URL` in `.env`

### TypeScript errors
```bash
pnpm type-check
pnpm build
```

### Turbo cache issues
```bash
pnpm clean:cache
```

## 📝 License

Private - All rights reserved

## 👥 Team

Atriz Development Team

---

**Need Help?** Check `.cascade/context.md` for detailed patterns and troubleshooting, or `.cascade/rules.md` for project guidelines.
