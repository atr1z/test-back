# Database Architecture & Migration Guide

## Overview

The Atriz framework uses PostgreSQL with a **multi-database architecture** that separates shared authentication data from application-specific data. This design enables cross-application authentication while maintaining data isolation.

## Architecture

### Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Server                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  atriz_shared    │        │    atriz_db      │          │
│  │  (Core Package)  │◄──────►│  (Atriz App)     │          │
│  │                  │        │                  │          │
│  │  - users         │        │  - user_profiles │          │
│  │  - auth_tokens   │        │  - app data      │          │
│  │  - roles         │        └──────────────────┘          │
│  │  - user_roles    │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           │         ┌──────────────────┐                    │
│           └────────►│  mextrack_db     │                    │
│                     │  (Mextrack App)  │                    │
│                     │                  │                    │
│                     │  - vehicles      │                    │
│                     │  - tracking_data │                    │
│                     └──────────────────┘                    │
│                                                              │
│                     ┌──────────────────┐                    │
│                     │   pshop_db       │                    │
│                     │  (PShop App)     │                    │
│                     │                  │                    │
│                     │  - products      │                    │
│                     │  - inventory     │                    │
│                     └──────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Descriptions

| Database | Owner | Purpose |
|----------|-------|---------|
| `atriz_shared` | `@atriz/core` | Shared user authentication, authorization, roles |
| `atriz_db` | `@atriz/website` | Atriz application-specific data |
| `mextrack_db` | `@atriz/mextrack-api` | Fleet tracking and vehicle management |
| `pshop_db` | `@atriz/pshop-api` | Point-of-sale and inventory management |

## Design Principles

### 1a: Separate Databases Strategy
- Each app has its own isolated database
- Shared database for cross-app authentication
- Apps cannot directly query other apps' databases

### 2a: Single Source of Truth Authentication
- All applications authenticate against `atriz_shared`
- User credentials stored once, used everywhere
- Consistent user experience across all apps

### 3b: Shared Data Only Through Shared Database
- Apps are isolated for business data
- Cross-app references use `user_id` foreign keys
- No direct database access between applications

## Getting Started

### Prerequisites

- PostgreSQL 12+ installed and running
- `pnpm` package manager
- Node.js 18+

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure PostgreSQL credentials (root .env file)
cp env.example .env
# Edit .env with your PostgreSQL credentials (PGHOST, PGPORT, PGUSER, PGPASSWORD)

# 3. Build the database package
pnpm build

# 4. Create all databases
pnpm db:create

# Or create specific databases
pnpm db:create:core         # Core/shared auth database only
pnpm db:create:atriz        # Atriz app database only
pnpm db:create:mextrack     # Mextrack app database only
pnpm db:create:pshop        # PShop app database only

# 5. Configure app environment variables (see below)

# 6. Run shared database migrations
pnpm db:migrate:core

# 7. Run application migrations
pnpm db:migrate:atriz
pnpm db:migrate:mextrack
pnpm db:migrate:pshop

# 8. (Optional) Seed development data
pnpm db:seed:core
pnpm db:seed:atriz
```

### Setting Up a Single Application

If you only want to work on one app (e.g., Mextrack):

```bash
# 1. Create required databases
pnpm db:create:core          # Create core/shared database
pnpm db:create:mextrack      # Create Mextrack database

# 2. Configure environment variables
# Edit packages/core/.env and apps/mextrack/.env

# 3. Run migrations
pnpm db:migrate:core         # Shared database
pnpm db:migrate:mextrack     # Mextrack database

# 4. (Optional) Seed data
pnpm db:seed:core            # Shared data
pnpm db:seed:mextrack        # Mextrack data
```

### Environment Configuration

The project uses two types of environment configuration:

1. **Root `.env`** - PostgreSQL server credentials (for database scripts)
2. **Package `.env` files** - Application database URLs (for apps and packages)

#### Root Environment (`.env`)

This file is used by database management scripts to connect to PostgreSQL:

```env
# Copy from env.example
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
```

**Note:** This is for server-level access to create/manage databases, not for application use.

#### Core Package (`packages/core/.env`)

```env
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_shared
NODE_ENV=development
```

#### Application Packages (`apps/{app}/.env`)

```env
# App-specific database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{app}_db

# Shared database for authentication
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_shared

# Other app config...
NODE_ENV=development
PORT=3000
```

## Migration Workflow

### Creating Migrations

Migrations use `node-pg-migrate` with SQL files for maximum control.

#### For Shared Database (Core)

```bash
# Create new migration
cd packages/core
pnpm migrate:create add_user_metadata_column

# Edit the generated SQL file in migrations/
# migrations/1234567890_add_user_metadata_column.sql
```

#### For Application Databases

```bash
# Create new migration for Atriz app
cd apps/atriz
pnpm migrate:create add_profiles_table

# For Mextrack
cd apps/mextrack
pnpm migrate:create add_vehicles_table

# For PShop
cd apps/pshop
pnpm migrate:create add_products_table
```

### Migration File Structure

```sql
-- Migration: Add user metadata
-- Created: 2025-10-19

-- Up migration
CREATE TABLE user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);

-- Add comments
COMMENT ON TABLE user_metadata IS 'Flexible user metadata storage';
```

### Running Migrations

```bash
# Run all migrations (Turbo runs in dependency order)
pnpm db:migrate

# Run specific database migrations
pnpm db:migrate:core      # Shared database
pnpm db:migrate:atriz     # Atriz app
pnpm db:migrate:mextrack  # Mextrack app
pnpm db:migrate:pshop     # PShop app

# Run migrations manually (from package directory)
cd packages/core
pnpm migrate up           # Apply migrations
pnpm migrate down         # Rollback last migration
pnpm migrate down --count=2  # Rollback 2 migrations
```

### Migration Best Practices

1. **Always use transactions** - Migrations run in transactions by default
2. **Write reversible migrations** - Consider how to rollback
3. **Test migrations locally** before deploying
4. **Use descriptive names** for migration files
5. **Add comments** to document table purposes
6. **Create indexes** for frequently queried columns
7. **Use constraints** to enforce data integrity

## Seeding Data

Seeds are TypeScript files that execute in alphabetical order.

### Creating Seed Files

```typescript
// packages/core/seeds/001_seed_default_users.ts
import { Pool } from 'pg';
import { SeedFunction } from '@atriz/database';

const seed: SeedFunction = async (pool: Pool) => {
  console.log('Seeding default users...');

  // Skip in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping seed in production');
    return;
  }

  await pool.query(`
    INSERT INTO users (email, password_hash, name, email_verified)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO NOTHING
  `, ['admin@atriz.dev', '$2a$10$...', 'Admin User', true]);

  console.log('✓ Seeded default users');
};

export default seed;
```

### Running Seeds

```bash
# Run all seeds
pnpm db:seed

# Run specific database seeds
pnpm db:seed:core
pnpm db:seed:atriz
pnpm db:seed:mextrack
pnpm db:seed:pshop
```

## Database Connection Management

### Using the Database Package

```typescript
import { createDatabasePool, withTransaction } from '@atriz/database';

// Create connection pool
const db = createDatabasePool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Query data
const users = await db.query('SELECT * FROM users WHERE is_active = $1', [true]);

// Use transactions
await withTransaction(db.pool, async (client) => {
  await client.query('INSERT INTO users (...) VALUES (...)');
  await client.query('INSERT INTO user_roles (...) VALUES (...)');
  // Auto-commits on success, rolls back on error
});

// Close connection
await db.close();
```

### Connection Pool Best Practices

1. **Reuse pools** - Create once, use throughout app lifecycle
2. **Set appropriate pool size** - Default is 10, adjust based on load
3. **Use transactions** for multi-step operations
4. **Always close pools** when shutting down
5. **Handle connection errors** gracefully

## Schema Management

### Shared Database Schema (`atriz_shared`)

```sql
-- Users (authentication)
users (id, email, password_hash, name, email_verified, is_active, ...)

-- Auth tokens (JWT tracking)
auth_tokens (id, user_id, token_type, token_hash, expires_at, ...)

-- Roles (RBAC)
roles (id, name, description)
user_roles (id, user_id, role_id)
```

### Cross-Database References

Applications reference users via `user_id` UUID:

```sql
-- In mextrack_db
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,  -- References users.id in atriz_shared
  vehicle_name VARCHAR(255),
  ...
);
```

**Note:** Foreign key constraints cannot span databases. Enforce referential integrity at the application level.

## Common Tasks

### Add a New Table

```bash
# 1. Create migration
cd apps/atriz
pnpm migrate:create add_user_preferences

# 2. Edit migration file
vim migrations/1234567890_add_user_preferences.sql

# 3. Run migration
pnpm migrate
```

### Add a Column to Existing Table

```sql
-- Migration: Add avatar_url to users
ALTER TABLE users 
ADD COLUMN avatar_url VARCHAR(500);

CREATE INDEX idx_users_avatar ON users(avatar_url) 
WHERE avatar_url IS NOT NULL;
```

### Modify a Column

```sql
-- Migration: Change column type
ALTER TABLE users 
ALTER COLUMN name TYPE TEXT;

-- Add constraint
ALTER TABLE users
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
```

### Rename a Table

```sql
-- Migration: Rename table
ALTER TABLE old_table_name 
RENAME TO new_table_name;

-- Update indexes
ALTER INDEX old_index_name 
RENAME TO new_index_name;
```

### Drop a Table

```sql
-- Migration: Drop table (use with caution!)
DROP TABLE IF EXISTS old_table CASCADE;
```

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify databases exist
psql -U postgres -c "\l"

# Test connection
psql -U postgres -d atriz_shared -c "SELECT 1"
```

### Migration Fails

```bash
# Check migration status
cd packages/core
pnpm migrate status

# Roll back last migration
pnpm migrate down

# Re-run migration
pnpm migrate up
```

### Port Already in Use

```bash
# Find process using PostgreSQL port
lsof -i :5432

# Kill process if needed
kill -9 <PID>
```

### Permission Errors

```sql
-- Grant permissions to user
GRANT ALL PRIVILEGES ON DATABASE atriz_shared TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Clean Database (Development Only)

⚠️ **WARNING**: These commands will DELETE ALL DATA (but preserve database structure)!

```bash
# Clean all databases (truncates all tables)
pnpm db:clean

# Clean specific databases
pnpm db:clean:core      # Clean core/shared database only
pnpm db:clean:atriz     # Clean Atriz app database only
pnpm db:clean:mextrack  # Clean Mextrack app database only
pnpm db:clean:pshop     # Clean PShop app database only

# After cleaning, just re-seed (no migrations needed!)
pnpm db:seed:core       # For core database
pnpm db:seed            # For all app databases
```

**What `db:clean` does:**
- ✅ Truncates all tables (deletes all data)
- ✅ Resets auto-increment sequences
- ✅ Preserves database structure (tables, columns, indexes)
- ✅ Preserves migration history
- ❌ Does NOT drop or recreate databases

#### Manual Reset (Alternative)

If you prefer to use psql directly:

```bash
# Drop databases
psql -U postgres -c "DROP DATABASE IF EXISTS atriz_shared"
psql -U postgres -c "DROP DATABASE IF EXISTS atriz_db"
psql -U postgres -c "DROP DATABASE IF EXISTS mextrack_db"
psql -U postgres -c "DROP DATABASE IF EXISTS pshop_db"

# Recreate
pnpm db:create

# Re-run migrations
pnpm db:migrate:core
pnpm db:migrate
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested locally
- [ ] Backup production databases
- [ ] Migration rollback plan ready
- [ ] Environment variables configured
- [ ] SSL/TLS enabled for database connections
- [ ] Connection pools sized appropriately
- [ ] Database credentials rotated
- [ ] Monitoring and alerts configured

### Deployment Steps

```bash
# 1. Backup databases
pg_dump -U postgres atriz_shared > backup_shared_$(date +%Y%m%d).sql
pg_dump -U postgres atriz_db > backup_atriz_$(date +%Y%m%d).sql

# 2. Run migrations (in order)
NODE_ENV=production pnpm db:migrate:core
NODE_ENV=production pnpm db:migrate:atriz
NODE_ENV=production pnpm db:migrate:mextrack
NODE_ENV=production pnpm db:migrate:pshop

# 3. Verify migrations
# Check application health endpoints

# 4. Monitor for errors
# Watch application logs and database performance
```

### Connection Strings (Production)

Use connection pooling services like PgBouncer for production:

```env
SHARED_DATABASE_URL=postgresql://user:pass@pgbouncer.example.com:6432/atriz_shared?sslmode=require
DATABASE_URL=postgresql://user:pass@pgbouncer.example.com:6432/atriz_db?sslmode=require
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate)
- [pg (node-postgres)](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl-best-practices.html)

## Support

For questions or issues:
1. Check this documentation
2. Review existing migrations
3. Check GitHub issues
4. Contact the team

---

**Last Updated:** 2025-10-19  
**Maintainer:** Atriz Development Team

