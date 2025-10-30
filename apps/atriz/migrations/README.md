# Atriz App Database Migrations

This directory contains SQL migration files for the **Atriz application database**.

The Atriz database contains app-specific data such as:

- User profiles
- Application-specific features
- Content and data unique to the Atriz app

## Creating a Migration

From the **root** of the project:

```bash
# Note: Atriz app uses the core database
pnpm db:migrate:create:core <migration-name>
```

From the **apps/atriz** directory:

```bash
pnpm db:migrate:create <migration-name>
```

Example:

```bash
pnpm db:migrate:create user_profiles_table
```

## Running Migrations

From the **root** of the project:

```bash
pnpm db:migrate:core
```

From the **apps/atriz** directory:

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

**Note:** The Atriz app shares the core database for authentication and user management.
