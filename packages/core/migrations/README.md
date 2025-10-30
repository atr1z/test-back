# Core Package Migrations

This directory contains all database migrations for the core package.

## Structure

```
migrations/
├── shared/          # Core/shared database migrations (auth, users, roles)
└── tracking/        # Tracking database migrations (TimescaleDB for location data)
```

## Databases

### Shared Database

- **Purpose:** Core authentication, users, roles, and shared functionality
- **Environment Variable:** `CORE_DATABASE_URL` or `DATABASE_URL`
- **Migration Location:** `shared/`
- **Seed Location:** `../seeds/`

### Tracking Database

- **Purpose:** TimescaleDB instance for time-series location data
- **Environment Variable:** `TRACKING_DATABASE_URL`
- **Migration Location:** `tracking/`
- **Type:** TimescaleDB with hypertables, compression, and retention policies

## Usage

### Creating Migrations

```bash
# Core/shared database migration
pnpm db:migrate:create:core create_users_table

# Tracking database migration
pnpm db:migrate:create:tracking create_location_events
```

### Running Migrations

```bash
# From root
pnpm db:migrate:core          # Run core migrations
pnpm db:migrate:tracking      # Run tracking migrations

# From packages/core/
pnpm db:migrate               # Run core migrations
pnpm db:migrate:tracking      # Run tracking migrations
```

### Check Status

```bash
# From root
pnpm db:migrate:status:core
pnpm db:migrate:status:tracking

# From packages/core/
pnpm db:migrate:status
pnpm db:migrate:tracking:status
```

## More Information

- See `shared/README.md` for core database details
- See `tracking/README.md` for TimescaleDB details
- See `../seeds/README.md` for seeding information
