# Database Migration Commands

This document provides a comprehensive overview of all database migration and seeding commands available in the monorepo.

## Database Architecture

The project uses multiple PostgreSQL databases:

| Database       | Description                   | Location                            | Environment Variable                  |
| -------------- | ----------------------------- | ----------------------------------- | ------------------------------------- |
| **core**       | Authentication, users, roles  | `packages/core/migrations/shared`   | `CORE_DATABASE_URL` or `DATABASE_URL` |
| **tracking**   | TimescaleDB for location data | `packages/core/migrations/tracking` | `TRACKING_DATABASE_URL`               |
| **followsite** | Followsite/Mextrack app data  | `apps/followsite/migrations`        | `FOLLOWSITE_DATABASE_URL`             |
| **pshop**      | PShop e-commerce data         | `apps/pshop/migrations`             | `PSHOP_DATABASE_URL`                  |

## Quick Start

### 1. Set up environment variables

Create a `.env` file in each app directory with the appropriate database URLs:

```bash
# Core database (shared by core package and atriz app)
CORE_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core

# Tracking database (TimescaleDB)
TRACKING_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_tracking

# Followsite database
FOLLOWSITE_DATABASE_URL=postgresql://user:password@localhost:5432/mextrack_db

# PShop database
PSHOP_DATABASE_URL=postgresql://user:password@localhost:5432/pshop_db
```

### 2. Run all migrations

```bash
pnpm db:migrate
```

### 3. Seed all databases

```bash
pnpm db:seed
```

## All Available Commands (from Root)

### Migration Commands

#### Run Migrations (Up)

```bash
pnpm db:migrate                  # Run all migrations
pnpm db:migrate:core             # Core database only
pnpm db:migrate:tracking         # Tracking database only
pnpm db:migrate:followsite       # Followsite database only
pnpm db:migrate:pshop            # PShop database only
```

#### Rollback Migrations (Down)

```bash
pnpm db:migrate:down             # Rollback all migrations
pnpm db:migrate:down:core        # Rollback core migrations
pnpm db:migrate:down:tracking    # Rollback tracking migrations
pnpm db:migrate:down:followsite  # Rollback followsite migrations
pnpm db:migrate:down:pshop       # Rollback pshop migrations
```

#### Check Migration Status

```bash
pnpm db:migrate:status           # Status of all migrations
pnpm db:migrate:status:core      # Core database status
pnpm db:migrate:status:tracking  # Tracking database status
pnpm db:migrate:status:followsite # Followsite database status
pnpm db:migrate:status:pshop     # PShop database status
```

#### Create New Migrations

```bash
pnpm db:migrate:create:core <migration-name>
pnpm db:migrate:create:tracking <migration-name>
pnpm db:migrate:create:followsite <migration-name>
pnpm db:migrate:create:pshop <migration-name>
```

**Examples:**

```bash
pnpm db:migrate:create:core create_users_table
pnpm db:migrate:create:tracking create_location_events_hypertable
pnpm db:migrate:create:followsite create_vehicles_table
pnpm db:migrate:create:pshop create_products_table
```

### Seed Commands

```bash
pnpm db:seed                     # Seed all databases
pnpm db:seed:core                # Seed core database
pnpm db:seed:followsite          # Seed followsite database
pnpm db:seed:pshop               # Seed pshop database
```

## Package-Specific Commands

### Core Package (`packages/core`)

```bash
cd packages/core

# Migrations (Core DB)
pnpm db:migrate                  # Run migrations
pnpm db:migrate:up               # Run migrations (explicit)
pnpm db:migrate:down             # Rollback migrations
pnpm db:migrate:status           # Check status
pnpm db:migrate:create <name>    # Create new migration

# Migrations (Tracking DB)
pnpm db:migrate:tracking         # Run tracking migrations
pnpm db:migrate:tracking:up      # Run tracking migrations (explicit)
pnpm db:migrate:tracking:down    # Rollback tracking migrations
pnpm db:migrate:tracking:status  # Check tracking status
pnpm db:migrate:tracking:create <name> # Create tracking migration

# Seeds
pnpm db:seed                     # Run seeds
pnpm db:seed:run                 # Run seeds (explicit)
```

### Atriz App (`apps/atriz`)

**Note:** Atriz app uses the core database.

```bash
cd apps/atriz

# Migrations
pnpm db:migrate                  # Run migrations
pnpm db:migrate:up               # Run migrations (explicit)
pnpm db:migrate:down             # Rollback migrations
pnpm db:migrate:status           # Check status
pnpm db:migrate:create <name>    # Create new migration

# Seeds
pnpm db:seed                     # Run seeds
pnpm db:seed:run                 # Run seeds (explicit)
```

### Followsite App (`apps/followsite`)

```bash
cd apps/followsite

# Migrations
pnpm db:migrate                  # Run migrations
pnpm db:migrate:up               # Run migrations (explicit)
pnpm db:migrate:down             # Rollback migrations
pnpm db:migrate:status           # Check status
pnpm db:migrate:create <name>    # Create new migration

# Seeds
pnpm db:seed                     # Run seeds
pnpm db:seed:run                 # Run seeds (explicit)
```

### PShop App (`apps/pshop`)

```bash
cd apps/pshop

# Migrations
pnpm db:migrate                  # Run migrations
pnpm db:migrate:up               # Run migrations (explicit)
pnpm db:migrate:down             # Rollback migrations
pnpm db:migrate:status           # Check status
pnpm db:migrate:create <name>    # Create new migration

# Seeds
pnpm db:seed                     # Run seeds
pnpm db:seed:run                 # Run seeds (explicit)
```

## Workflow Examples

### Creating Your First Migration

1. **Create the migration file:**

```bash
pnpm db:migrate:create:core create_users_table
```

2. **Edit the generated SQL file** in `packages/core/migrations/shared/`:

```sql
-- Up Migration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Down Migration
DROP TABLE IF EXISTS users;
```

3. **Run the migration:**

```bash
pnpm db:migrate:core
```

4. **Check the status:**

```bash
pnpm db:migrate:status:core
```

### Creating a Seed File

1. **Create the seed file** in the appropriate directory (e.g., `packages/core/seeds/001_seed_users.ts`):

```typescript
import { Pool } from 'pg';

export default async (pool: Pool) => {
    await pool.query(`
        INSERT INTO users (email, name, password_hash, role) VALUES
        ('admin@example.com', 'Admin User', '$2b$10$hash', 'admin'),
        ('user@example.com', 'Regular User', '$2b$10$hash', 'user')
        ON CONFLICT (email) DO NOTHING
    `);
};
```

2. **Run the seeds:**

```bash
pnpm db:seed:core
```

### Full Database Setup from Scratch

```bash
# 1. Run all migrations
pnpm db:migrate

# 2. Seed all databases
pnpm db:seed

# 3. Check status
pnpm db:migrate:status
```

### Working with TimescaleDB (Tracking Database)

1. **Enable TimescaleDB extension:**

First migration should enable the extension:

```sql
-- Up Migration
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Down Migration
DROP EXTENSION IF EXISTS timescaledb CASCADE;
```

2. **Create hypertable migration:**

```bash
pnpm db:migrate:create:tracking create_location_events_hypertable
```

Edit the migration:

```sql
-- Up Migration
CREATE TABLE location_events (
    time TIMESTAMPTZ NOT NULL,
    device_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    metadata JSONB
);

-- Create hypertable
SELECT create_hypertable('location_events', 'time');

-- Add retention policy (30 days)
SELECT add_retention_policy('location_events', INTERVAL '30 days');

-- Enable compression
ALTER TABLE location_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id'
);

-- Add compression policy (compress after 7 days)
SELECT add_compression_policy('location_events', INTERVAL '7 days');

-- Down Migration
DROP TABLE IF EXISTS location_events;
```

3. **Run the migration:**

```bash
pnpm db:migrate:tracking
```

## Migration Best Practices

1. **Always include both UP and DOWN migrations** for easy rollback
2. **Use transactions** when possible (wrap in BEGIN/COMMIT)
3. **Add indexes** for frequently queried columns
4. **Use ON CONFLICT** in seeds to make them idempotent
5. **Test rollbacks** before deploying to production
6. **Version control** all migration files
7. **Document complex migrations** with comments
8. **Use numeric prefixes** for seed files to control execution order

## Troubleshooting

### Migration fails with "relation already exists"

Check if the migration was already run:

```bash
pnpm db:migrate:status:core
```

### Cannot connect to database

1. Verify PostgreSQL is running
2. Check environment variables in `.env` files
3. Verify database credentials
4. Check firewall/network settings

### Seed files not executing in order

Ensure seed files use numeric prefixes:

- ✅ `001_seed_users.ts`
- ✅ `002_seed_roles.ts`
- ❌ `seed_users.ts`

### TimescaleDB extension not found

Install TimescaleDB on your PostgreSQL instance:

```bash
# On macOS
brew install timescaledb

# On Ubuntu/Debian
sudo apt install timescaledb-postgresql-14
```

## Additional Resources

- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Direct Script Usage

You can also run the migration and seed scripts directly:

```bash
# Migrations
node scripts/migrate.mjs <command> <database> [migration-name]

# Examples
node scripts/migrate.mjs up core
node scripts/migrate.mjs create followsite create_vehicles_table
node scripts/migrate.mjs status all

# Seeds
node scripts/seed.mjs run <database>

# Examples
node scripts/seed.mjs run core
node scripts/seed.mjs run all
```

## Support

For issues or questions about migrations:

1. Check the README.md in each migration directory
2. Review the database rules: `.cursor/rules/database.mdc`
3. Check the project documentation: `.cursor/rules/project.mdc`
