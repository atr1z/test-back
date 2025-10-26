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
│  │   atriz_core     │        │    atriz_db      │          │
│  │  (Core Package)  │◄──────►│  (Atriz App)     │          │
│  │                  │        │                  │          │
│  │  - users         │        │  - user_profiles │          │
│  │  - auth_tokens   │        │  - app data      │          │
│  │  - roles         │        └──────────────────┘          │
│  │  - user_roles    │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           │         ┌──────────────────┐                    │
│           ├────────►│  mextrack_db     │                    │
│           │         │  (Mextrack App)  │                    │
│           │         │                  │                    │
│           │         │  - vehicles      │                    │
│           │         │  - drivers       │                    │
│           │         └──────────────────┘                    │
│           │                                                  │
│           │         ┌──────────────────┐                    │
│           ├────────►│   pshop_db       │                    │
│           │         │  (PShop App)     │                    │
│           │         │                  │                    │
│           │         │  - products      │                    │
│           │         │  - orders        │                    │
│           │         │  - deliveries    │                    │
│           │         └──────────────────┘                    │
│           │                                                  │
│           │         ┌──────────────────┐                    │
│           └────────►│ atriz_tracking   │                    │
│                     │ (TimescaleDB)    │                    │
│                     │                  │                    │
│                     │ - location_events│ (30 day retention) │
│                     │ - location_hourly│ (1 year aggregate) │
│                     └──────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Descriptions

| Database | Owner | Purpose |
|----------|-------|---------|
| `atriz_core` | `@atriz/core` | Shared user authentication, authorization, roles |
| `atriz_tracking` | `@atriz/core` | **High-volume time-series location/GPS data (TimescaleDB)** |
| `atriz_db` | `@atriz/website` | Atriz application-specific data |
| `mextrack_db` | `@atriz/mextrack-api` | Fleet tracking metadata (vehicles, drivers, NOT raw GPS) |
| `pshop_db` | `@atriz/pshop-api` | Point-of-sale, orders, deliveries (NOT raw GPS) |

## Design Principles

### 1a: Separate Databases Strategy
- Each app has its own isolated database
- Shared database for cross-app authentication
- Apps cannot directly query other apps' databases

### 2a: Single Source of Truth Authentication
- All applications authenticate against `atriz_core`
- User credentials stored once, used everywhere
- Consistent user experience across all apps

### 3b: Shared Data Only Through Shared Database
- Apps are isolated for business data
- Cross-app references use `user_id` foreign keys
- No direct database access between applications

### 4: Time-Series Data Separation (TimescaleDB)
- High-volume location/GPS data in dedicated `atriz_tracking` database
- Uses TimescaleDB extension for automatic partitioning and compression
- Prevents mixing critical user data with massive telemetry data
- Independent backup and retention strategies

## Time-Series Database Strategy (`atriz_tracking`)

### The Problem

**Location data grows exponentially:**
- Fleet tracking: Vehicles report GPS every 10-30 seconds
- Delivery tracking: Drivers report location during active deliveries
- **Result**: Millions of records per day, gigabytes per month

**Why not store in application databases?**
- ❌ Backup times become unacceptably slow (hours instead of minutes)
- ❌ Critical user data mixed with disposable telemetry data
- ❌ Database grows unbounded without manual cleanup
- ❌ Expensive storage costs for old data with limited value
- ❌ Restoration from backup takes too long in emergencies

### The Solution: Dedicated TimescaleDB Database

**TimescaleDB Benefits:**
- 📦 **Automatic Partitioning**: Data chunked by time (e.g., 1-day chunks)
- 🗜️ **Compression**: 10-20x space savings on historical data
- 🗓️ **Retention Policies**: Auto-delete old data (e.g., keep 30 days)
- ⚡ **Fast Queries**: Optimized time-range queries
- 💾 **Isolated Backups**: Separate from critical user data

### Architecture Design

**Data Separation:**

| Data Type | Database | Retention | Backup Frequency |
|-----------|----------|-----------|------------------|
| Users, auth, roles | `atriz_core` | Permanent | Daily (critical) |
| Vehicles, drivers | `mextrack_db` | Permanent | Daily |
| Orders, products | `pshop_db` | Permanent | Daily |
| **Raw GPS points** | `atriz_tracking` | **30 days** | Weekly/None |
| **Aggregated routes** | `atriz_tracking` | **1 year** | Weekly/None |

**Schema Design:**

```sql
-- In atriz_tracking database

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Raw location events table
CREATE TABLE location_events (
  time TIMESTAMPTZ NOT NULL,
  device_id UUID NOT NULL,
  user_id UUID NOT NULL,           -- References atriz_core.users.id
  app_source VARCHAR(50) NOT NULL, -- 'mextrack' or 'pshop'
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),           -- meters
  altitude DECIMAL(8, 2),           -- meters
  speed DECIMAL(6, 2),              -- km/h
  heading DECIMAL(5, 2),            -- degrees (0-360)
  metadata JSONB                    -- Additional telemetry
);

-- Convert to TimescaleDB hypertable (auto-partitions by time)
SELECT create_hypertable('location_events', 'time', chunk_time_interval => INTERVAL '1 day');

-- Add indexes for common queries
CREATE INDEX idx_location_device ON location_events (device_id, time DESC);
CREATE INDEX idx_location_user ON location_events (user_id, time DESC);
CREATE INDEX idx_location_app ON location_events (app_source, time DESC);

-- Add automatic retention policy (delete data older than 30 days)
SELECT add_retention_policy('location_events', INTERVAL '30 days');

-- Enable compression for data older than 7 days
ALTER TABLE location_events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, user_id, app_source',
  timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('location_events', INTERVAL '7 days');

-- Continuous aggregate for hourly statistics (keep for 1 year)
CREATE MATERIALIZED VIEW location_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  device_id,
  user_id,
  app_source,
  COUNT(*) as point_count,
  AVG(latitude) as avg_latitude,
  AVG(longitude) as avg_longitude,
  AVG(speed) as avg_speed,
  MAX(speed) as max_speed,
  MIN(time) as first_event,
  MAX(time) as last_event
FROM location_events
GROUP BY hour, device_id, user_id, app_source;

-- Retention policy for aggregated data (1 year)
SELECT add_retention_policy('location_hourly', INTERVAL '1 year');
```

### Data Flow

**1. GPS Data Collection:**
```
Vehicle/Driver → App Backend → atriz_tracking.location_events
```

**2. Recent Data Queries (< 24 hours):**
```
App → Query location_events directly → Return raw GPS points
```

**3. Historical Data Queries (> 24 hours):**
```
App → Query location_hourly aggregate → Return summary stats
```

**4. Automatic Cleanup:**
```
TimescaleDB → Drops partitions older than 30 days → No manual DELETE queries
```

### Usage in Applications

**TypeScript Example:**

```typescript
import { createDatabasePool, createHypertable, addRetentionPolicy } from '@atriz/database';

// Create connection to tracking database
const trackingDb = createDatabasePool({
  connectionString: process.env.TRACKING_DATABASE_URL,
  max: 20,
});

// Enable TimescaleDB and setup hypertable (run once during setup)
await enableTimescaleDB(trackingDb.pool);
await createHypertable(trackingDb.pool, 'location_events', 'time', '1 day');
await addRetentionPolicy(trackingDb.pool, 'location_events', '30 days');

// Insert GPS data from Mextrack
async function recordVehicleLocation(data: {
  deviceId: string;
  userId: string;
  latitude: number;
  longitude: number;
  speed?: number;
}) {
  await trackingDb.query(`
    INSERT INTO location_events (time, device_id, user_id, app_source, latitude, longitude, speed)
    VALUES (NOW(), $1, $2, 'mextrack', $3, $4, $5)
  `, [data.deviceId, data.userId, data.latitude, data.longitude, data.speed]);
}

// Query recent locations (last 24 hours)
async function getRecentLocations(deviceId: string) {
  const result = await trackingDb.query(`
    SELECT time, latitude, longitude, speed
    FROM location_events
    WHERE device_id = $1
      AND time > NOW() - INTERVAL '24 hours'
    ORDER BY time DESC
  `, [deviceId]);
  
  return result.rows;
}

// Query hourly stats for analytics
async function getHourlyStats(deviceId: string, days: number = 7) {
  const result = await trackingDb.query(`
    SELECT hour, point_count, avg_speed, max_speed
    FROM location_hourly
    WHERE device_id = $1
      AND hour > NOW() - INTERVAL '${days} days'
    ORDER BY hour DESC
  `, [deviceId]);
  
  return result.rows;
}
```

### Backup Strategy

**Critical Data (Daily Backups):**
```bash
# Small, fast, critical
pg_dump -U postgres atriz_core > backups/core_$(date +%Y%m%d).sql
pg_dump -U postgres mextrack_db > backups/mextrack_$(date +%Y%m%d).sql
pg_dump -U postgres pshop_db > backups/pshop_$(date +%Y%m%d).sql
```

**Time-Series Data (Weekly or Skip):**
```bash
# Large, slow, disposable after 30 days
pg_dump -U postgres atriz_tracking > backups/tracking_$(date +%Y%m%d).sql

# OR skip entirely - data is temporary and recreated from live sources
```

**Why This Works:**
- User data restores in minutes, not hours
- GPS data is disposable (retention = 30 days)
- If tracking DB is lost, only recent data is affected
- New GPS data starts accumulating immediately

### Installation & Setup

**1. Install TimescaleDB:**

```bash
# macOS (Homebrew)
brew tap timescale/tap
brew install timescaledb

# Ubuntu/Debian
sudo add-apt-repository ppa:timescale/timescaledb-ppa
sudo apt install timescaledb-postgresql-14

# Configure PostgreSQL
sudo timescaledb-tune --quiet --yes

# Restart PostgreSQL
sudo service postgresql restart
```

**2. Create Tracking Database:**

```bash
# Create database
createdb atriz_tracking

# Enable TimescaleDB extension
psql -d atriz_tracking -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE"
```

**3. Run Tracking Migrations:**

Create migration file in a new migrations directory for the tracking database with the schema shown above.

### Performance Considerations

**Query Optimization:**
- Use time-range filters (WHERE time > NOW() - INTERVAL '1 day')
- Query aggregates (location_hourly) instead of raw data when possible
- Add indexes on device_id, user_id, and app_source
- Use continuous aggregates for dashboards

**Compression Savings:**
- Raw data: ~50-100 bytes per record
- Compressed: ~5-10 bytes per record (10-20x savings)
- Compression happens automatically after 7 days

**Scaling:**
- TimescaleDB handles billions of rows efficiently
- Partition by time (1-day chunks recommended)
- Old partitions drop instantly (no DELETE scan)
- Compression reduces I/O for historical queries

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
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_core
NODE_ENV=development
```

#### Application Packages (`apps/{app}/.env`)

```env
# App-specific database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{app}_db

# Shared database for authentication
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_core

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);

-- Add comments
COMMENT ON TABLE user_metadata IS 'Flexible user metadata storage';
```

### Important: UTC Timezone Configuration

**All timestamps are stored and handled in UTC** for consistent time handling across timezones.

The framework automatically:
- Sets database connection timezone to UTC via `@atriz/database`
- Sets Node.js process timezone to UTC in all applications
- Uses `TIMESTAMP WITH TIME ZONE` for all timestamp columns

**Best Practices:**
- Always use `TIMESTAMP WITH TIME ZONE` instead of `TIMESTAMP`
- Store all times in UTC (handled automatically)
- Convert to user timezone only in the frontend/client
- Use `DEFAULT CURRENT_TIMESTAMP` for automatic UTC timestamps

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

### Shared Database Schema (`atriz_core`)

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
  user_id UUID NOT NULL,  -- References users.id in atriz_core
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
psql -U postgres -d atriz_core -c "SELECT 1"
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
GRANT ALL PRIVILEGES ON DATABASE atriz_core TO your_user;
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
psql -U postgres -c "DROP DATABASE IF EXISTS atriz_core"
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
pg_dump -U postgres atriz_core > backup_core_$(date +%Y%m%d).sql
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
SHARED_DATABASE_URL=postgresql://user:pass@pgbouncer.example.com:6432/atriz_core?sslmode=require
DATABASE_URL=postgresql://user:pass@pgbouncer.example.com:6432/atriz_db?sslmode=require
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [TimescaleDB Installation Guide](https://docs.timescale.com/install/latest/)
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate)
- [pg (node-postgres)](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl-best-practices.html)
- [Time-Series Best Practices](https://docs.timescale.com/use-timescale/latest/best-practices/)

## Support

For questions or issues:
1. Check this documentation
2. Review existing migrations
3. Check GitHub issues
4. Contact the team

---

**Last Updated:** 2025-10-19  
**Maintainer:** Atriz Development Team

