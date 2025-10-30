# PShop App Database Migrations

This directory contains SQL migration files for the **PShop application database**.

The PShop database contains:

- Products catalog
- Orders and transactions
- Delivery information
- Inventory management
- PShop-specific features

## Creating a Migration

From the **root** of the project:

```bash
pnpm db:migrate:create:pshop <migration-name>
```

From the **apps/pshop** directory:

```bash
pnpm db:migrate:create <migration-name>
```

Example:

```bash
pnpm db:migrate:create create_products_table
```

## Running Migrations

From the **root** of the project:

```bash
# Run pshop migrations
pnpm db:migrate:pshop

# Check migration status
pnpm db:migrate:status:pshop

# Rollback migrations
pnpm db:migrate:down:pshop
```

From the **apps/pshop** directory:

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
PSHOP_DATABASE_URL=postgresql://user:password@localhost:5432/pshop_db
```

## Database Architecture

PShop has its own dedicated database separate from core. It shares authentication with the core database but maintains its own domain-specific tables for e-commerce functionality.
