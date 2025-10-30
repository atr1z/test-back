# Followsite App Database Migrations

This directory contains SQL migration files for the **Followsite application database**.

The Followsite database contains:

- Vehicle tracking data
- Driver information
- Routes and geofencing
- Followsite-specific features

## Creating a Migration

From the **root** of the project:

```bash
pnpm db:migrate:create:followsite <migration-name>
```

From the **apps/followsite** directory:

```bash
pnpm db:migrate:create <migration-name>
```

Example:

```bash
pnpm db:migrate:create create_vehicles_table
```

## Running Migrations

From the **root** of the project:

```bash
# Run followsite migrations
pnpm db:migrate:followsite

# Check migration status
pnpm db:migrate:status:followsite

# Rollback migrations
pnpm db:migrate:down:followsite
```

From the **apps/followsite** directory:

```bash
# Run migrations
pnpm db:migrate

# Check status
pnpm db:migrate:status

# Rollback
pnpm db:migrate:down
```

## Environment Variables Required

```bash
FOLLOWSITE_DATABASE_URL=postgresql://user:password@localhost:5432/mextrack_db
```

## Database Architecture

Followsite has its own dedicated database separate from core. It shares authentication with the core database but maintains its own domain-specific tables.
