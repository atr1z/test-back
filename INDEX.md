# Mextrack Backends - File Index

Quick reference to all important files in this project.

## 📚 Documentation (Start Here!)

| File | Purpose |
|------|---------|
| **README.md** | Main project documentation - read this first |
| **GETTING_STARTED.md** | Step-by-step setup guide for new developers |
| **PROJECT_SUMMARY.md** | Complete overview of what was created |
| **CHECKLIST.md** | Setup verification checklist |
| **CONTRIBUTING.md** | Guidelines for contributing to the project |
| **INDEX.md** | This file - quick navigation guide |

## 🧠 Windsurf Context Files

| File | Purpose |
|------|---------|
| **.cascade/rules.md** | Project rules, guidelines, and best practices |
| **.cascade/context.md** | Quick reference, code patterns, and examples |

## ⚙️ Configuration Files

### Root Configuration
| File | Purpose |
|------|---------|
| **package.json** | Root package file with workspace scripts |
| **turbo.json** | Turborepo build pipeline configuration |
| **pnpm-workspace.yaml** | pnpm workspace configuration |
| **tsconfig.json** | Base TypeScript configuration |
| **.eslintrc.js** | ESLint configuration |
| **.prettierrc** | Prettier code formatting configuration |
| **.gitignore** | Git ignore patterns |

### VS Code Configuration
| File | Purpose |
|------|---------|
| **.vscode/settings.json** | VS Code workspace settings |
| **.vscode/extensions.json** | Recommended extensions |
| **.vscode/launch.json** | Debug configurations |
| **.vscode/tasks.json** | VS Code tasks |

### CI/CD
| File | Purpose |
|------|---------|
| **.github/workflows/test.yml** | Automated testing workflow |
| **.github/workflows/lint.yml** | Linting and type checking workflow |

## 📦 Shared Packages

### @mextrack/auth (`packages/auth/`)
| File | Purpose |
|------|---------|
| **src/lucia.ts** | Lucia Auth setup and configuration |
| **src/password.ts** | Password hashing with Argon2 |
| **src/middleware.ts** | Authentication middleware |
| **src/index.ts** | Package exports |
| **tests/password.test.ts** | Password hashing tests |

### @mextrack/database (`packages/database/`)
| File | Purpose |
|------|---------|
| **src/client.ts** | PostgreSQL client setup |
| **src/index.ts** | Package exports |
| **src/scripts/migrate.ts** | Migration runner |
| **src/scripts/create-migration.ts** | Migration generator |
| **src/scripts/rollback.ts** | Migration rollback |
| **src/scripts/seed.ts** | Seeder runner |
| **src/scripts/reset.ts** | Database reset (dev only) |
| **src/migrations/001_auth_tables.sql** | Auth tables migration |
| **src/migrations/002_mextrack_tables.sql** | Mextrack tables migration |
| **src/migrations/003_pshop_tables.sql** | PShop tables migration |
| **src/seeds/development/001_users.sql** | Test users |
| **src/seeds/development/002_mextrack_data.sql** | Mextrack test data |
| **src/seeds/development/003_pshop_data.sql** | PShop test data |
| **src/seeds/production/001_admin_user.sql** | Production admin user |

### @mextrack/types (`packages/types/`)
| File | Purpose |
|------|---------|
| **src/user.ts** | User types and DTOs |
| **src/auth.ts** | Authentication types |
| **src/common.ts** | Common types (pagination, etc.) |
| **src/api-response.ts** | API response types |
| **src/index.ts** | Package exports |

### @mextrack/utils (`packages/utils/`)
| File | Purpose |
|------|---------|
| **src/validation.ts** | Validation utilities with Zod |
| **src/errors.ts** | Custom error classes |
| **src/logger.ts** | Winston logger setup |
| **src/response.ts** | Response helper functions |
| **src/index.ts** | Package exports |
| **tests/validation.test.ts** | Validation tests |

## 🚀 Services

### Mextrack API (`apps/mextrack/`)
| File | Purpose |
|------|---------|
| **src/index.ts** | Application entry point |
| **src/routes/index.ts** | Route aggregator |
| **src/routes/auth.ts** | Authentication routes |
| **src/routes/vehicles.ts** | Vehicle routes |
| **src/routes/tracking.ts** | Tracking routes |
| **src/controllers/auth.controller.ts** | Auth request handlers |
| **src/controllers/vehicles.controller.ts** | Vehicle request handlers |
| **src/controllers/tracking.controller.ts** | Tracking request handlers |
| **src/services/vehicle.service.ts** | Vehicle business logic |
| **src/services/tracking.service.ts** | Tracking business logic |
| **src/middleware/error-handler.ts** | Global error handler |
| **.env.example** | Environment variables template |
| **.env.test** | Test environment configuration |
| **README.md** | Service documentation |

### PShop API (`apps/pshop/`)
| File | Purpose |
|------|---------|
| **src/index.ts** | Application entry point |
| **src/routes/index.ts** | Route aggregator |
| **src/routes/auth.ts** | Authentication routes |
| **src/routes/products.ts** | Product routes |
| **src/routes/sales.ts** | Sales routes |
| **src/middleware/error-handler.ts** | Global error handler |
| **.env.example** | Environment variables template |
| **README.md** | Service documentation |

## 🛠️ Utility Scripts

| File | Purpose |
|------|---------|
| **scripts/setup.sh** | Automated setup script |
| **scripts/clean-all.sh** | Clean all build artifacts |
| **scripts/dev-check.sh** | Development health check |

## 📋 Quick Command Reference

### Development
```bash
pnpm dev              # Start all services
pnpm dev:mextrack     # Start Mextrack only
pnpm dev:pshop        # Start PShop only
```

### Building
```bash
pnpm build            # Build all
pnpm build:mextrack   # Build Mextrack
pnpm build:pshop      # Build PShop
```

### Testing
```bash
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
```

### Database
```bash
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed dev data
pnpm db:reset         # Reset database
```

### Code Quality
```bash
pnpm lint             # Lint code
pnpm format           # Format code
pnpm type-check       # Check types
```

### Utility Scripts
```bash
./scripts/setup.sh        # Auto setup
./scripts/clean-all.sh    # Clean everything
./scripts/dev-check.sh    # Health check
```

## 🎯 Common Workflows

### New Developer Setup
1. Read **README.md**
2. Follow **GETTING_STARTED.md**
3. Use **CHECKLIST.md** to verify
4. Review **.cascade/rules.md**
5. Check **.cascade/context.md** for patterns

### Adding a Feature
1. Review **.cascade/rules.md** for guidelines
2. Check **.cascade/context.md** for patterns
3. Create feature branch
4. Implement with tests
5. Follow **CONTRIBUTING.md** for PR

### Database Changes
1. Run `pnpm db:migrate:create`
2. Edit migration in `packages/database/src/migrations/`
3. Run `pnpm db:migrate`
4. Add seeds if needed
5. Test thoroughly

### Debugging
1. Check **.vscode/launch.json** for debug configs
2. Use VS Code debugger
3. Check logs with Winston logger
4. Run `./scripts/dev-check.sh` for health

## 📖 Learning Resources

### External Documentation
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Lucia Auth Guide](https://lucia-auth.com)
- [postgres.js Docs](https://github.com/porsager/postgres)
- [Zod Documentation](https://zod.dev)
- [Vitest Guide](https://vitest.dev)

### Internal Documentation
- **README.md** - Project overview
- **.cascade/rules.md** - Project rules
- **.cascade/context.md** - Code patterns
- **CONTRIBUTING.md** - Contribution guide

## 🔗 File Relationships

```
Root Config → Packages → Services
     ↓           ↓         ↓
turbo.json   @mextrack/* mextrack-api
package.json             pshop-api
     ↓
pnpm-workspace.yaml
```

## 📁 Directory Structure

```
mextrack-backends/
├── apps/              # Services
├── packages/          # Shared packages
├── scripts/           # Utility scripts
├── .cascade/          # Windsurf rules
├── .github/           # CI/CD
├── .vscode/           # VS Code config
└── [docs].md          # Documentation files
```

## 🎯 Next Steps

1. **Start**: Read **GETTING_STARTED.md**
2. **Setup**: Follow **CHECKLIST.md**
3. **Learn**: Review **.cascade/rules.md**
4. **Code**: Use **.cascade/context.md** for patterns
5. **Contribute**: Follow **CONTRIBUTING.md**

---

**Tip**: Bookmark this file for quick navigation! 🔖
