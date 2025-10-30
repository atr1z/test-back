# Core Database Migrations

This directory contains SQL migration files for the **core database**.

The core database contains:

- User authentication tables
- User management
- Roles and permissions
- Auth tokens

## Creating a Migration

From the **root** of the project:

```bash
pnpm db:migrate:create:core <migration-name>
```

From the **packages/core** directory:

```bash
pnpm db:migrate:create <migration-name>
```

Example:

```bash
pnpm db:migrate:create:core create_users_table
```

## Running Migrations

From the **root** of the project:

```bash
# Run core migrations
pnpm db:migrate:core

# Check migration status
pnpm db:migrate:status:core

# Rollback migrations
pnpm db:migrate:down:core
```

From the **packages/core** directory:

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
CORE_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
```

## Migration File Format

Migration files are automatically created with the following format:

```
YYYYMMDDHHMMSS_<migration-name>.sql
```

Example: `20241030120000_create_users_table.sql`
