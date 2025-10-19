# Database Quick Start Guide

## TL;DR

```bash
# 1. Install dependencies
pnpm install

# 2. Build packages
pnpm build

# 3. Create databases
pnpm db:create

# 4. Run migrations
pnpm db:migrate:core    # Shared database first
pnpm db:migrate          # All app databases

# 5. (Optional) Seed development data
pnpm db:seed:core
pnpm db:seed
```

## What Was Just Set Up?

### New Package: `@atriz/database`

A new framework package for database management:
- PostgreSQL connection pooling
- Migration utilities using `node-pg-migrate`
- Seed data management
- Transaction support
- Full TypeScript support

### Database Architecture

**4 PostgreSQL Databases:**
1. `atriz_shared` - Shared user/auth data (managed by `@atriz/core`)
2. `atriz_db` - Atriz app-specific data
3. `mextrack_db` - Mextrack app data
4. `pshop_db` - PShop app data

**Key Principle:** All apps authenticate against the shared database while keeping their business data isolated.

### Migrations Created

**Shared Database (`atriz_shared`):**
- `users` table - User authentication
- `auth_tokens` table - JWT token tracking
- `roles` table - User roles (admin, user, guest)
- `user_roles` table - User-role assignments

**Application Databases:**
- Initial schema migrations (placeholder tables)
- Ready for you to add your app-specific tables

### New Commands Available

```bash
# Database Management
pnpm db:create           # Create all databases
pnpm db:migrate          # Run all migrations
pnpm db:seed             # Run all seeds

# Per-Database Commands
pnpm db:migrate:core     # Shared database migrations
pnpm db:migrate:atriz    # Atriz app migrations
pnpm db:migrate:mextrack # Mextrack migrations
pnpm db:migrate:pshop    # PShop migrations

# Seed commands work the same way
pnpm db:seed:core
pnpm db:seed:atriz
# etc...
```

## Environment Variables

Each package needs these environment variables (see `env.example` files):

```env
# For apps (apps/*/env.example)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{app}_db
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_shared

# For core (packages/core/env.example)
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_shared
```

## Next Steps

1. **Configure your `.env` files** in each package/app (copy from `env.example`)
2. **Create your app-specific migrations:**
   ```bash
   cd apps/atriz
   pnpm migrate:create create_my_table
   ```
3. **Write your seed files** in `seeds/` directories
4. **Use the database in your code:**
   ```typescript
   import { createDatabasePool } from '@atriz/database';
   
   const db = createDatabasePool({
     connectionString: process.env.DATABASE_URL
   });
   
   const users = await db.query('SELECT * FROM users');
   ```

## File Structure

```
packages/
  database/           # New package
    src/
      connection.ts   # Pool factory
      utils/
        migrationRunner.ts
        seed.ts
  core/
    migrations/       # Shared DB migrations
    seeds/           # Shared DB seeds
    migrate.ts       # Migration runner
    seed.ts          # Seed runner

apps/
  atriz/
    migrations/      # App-specific migrations
    seeds/          # App-specific seeds
    migrate.ts
    seed.ts
  mextrack/
    migrations/
    seeds/
    migrate.ts
    seed.ts
  pshop/
    migrations/
    seeds/
    migrate.ts
    seed.ts

scripts/
  create-databases.js  # Database creation utility

docs/
  DATABASE.md          # Full documentation
```

## Common Workflows

### Add a new table to your app

```bash
cd apps/atriz
pnpm migrate:create add_posts_table
# Edit the generated SQL file
pnpm migrate
```

### Add shared user functionality

```bash
cd packages/core
pnpm migrate:create add_user_preferences
# Edit the generated SQL file
pnpm migrate
```

### Reset everything (development only!)

```bash
# Drop all databases
psql -U postgres -c "DROP DATABASE atriz_shared"
psql -U postgres -c "DROP DATABASE atriz_db"
psql -U postgres -c "DROP DATABASE mextrack_db"
psql -U postgres -c "DROP DATABASE pshop_db"

# Recreate and migrate
pnpm db:create
pnpm db:migrate:core
pnpm db:migrate
pnpm db:seed:core
```

## Need Help?

- Full documentation: `docs/DATABASE.md`
- Example migrations: `packages/core/migrations/`
- Example seeds: `packages/core/seeds/`

---

**Built:** 2025-10-19  
**Ready to use!** 🚀

