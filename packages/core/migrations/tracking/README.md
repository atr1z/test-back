# Tracking Database Migrations (TimescaleDB)

This directory contains SQL migration files for the **tracking database**.

The tracking database is a TimescaleDB instance for time-series data:

- Location events (30-day retention)
- Location hourly aggregates (1-year retention)
- Real-time tracking data

## Creating a Migration

From the **root** of the project:

```bash
pnpm db:migrate:create:tracking <migration-name>
```

From the **packages/core** directory:

```bash
pnpm db:migrate:tracking:create <migration-name>
```

Example:

```bash
pnpm db:migrate:create:tracking create_location_events_hypertable
```

## Running Migrations

From the **root** of the project:

```bash
# Run tracking migrations
pnpm db:migrate:tracking

# Check migration status
pnpm db:migrate:status:tracking

# Rollback migrations
pnpm db:migrate:down:tracking
```

From the **packages/core** directory:

```bash
# Run migrations
pnpm db:migrate:tracking

# Check status
pnpm db:migrate:tracking:status

# Rollback
pnpm db:migrate:tracking:down
```

## Environment Variables Required

```bash
TRACKING_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_tracking
```

## TimescaleDB Setup

Make sure TimescaleDB extension is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

See the core framework for helper functions:

- `enableTimescaleDB()`
- `createHypertable()`
- `addRetentionPolicy()`
- `enableCompression()`
