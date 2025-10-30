# Core/Users Database Seeds

This directory contains seed files for the **core/users database**.

## Creating a Seed

From the **root** of the project:

```bash
pnpm db:seed:create:core seed_users
```

From the **packages/core** directory:

```bash
pnpm db:seed:create seed_users
```

This will create a numbered seed file like `001_seed_users.ts`.

## Running Seeds

From the **root** of the project:

```bash
pnpm db:seed:core
```

From the **packages/core** directory:

```bash
pnpm db:seed
```

## Seed File Format

Seed files are TypeScript modules that export a default function:

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

## Execution Order

Seeds are executed in alphabetical/numerical order based on their filename prefix:

- `001_seed_users.ts` (runs first)
- `002_seed_roles.ts` (runs second)
- `003_seed_permissions.ts` (runs third)

## Best Practices

1. **Use ON CONFLICT** to make seeds idempotent (can be run multiple times safely)
2. **Numeric prefixes** should be 3 digits (001, 002, 003, etc.)
3. **Descriptive names** help understand what data is being seeded
4. **Dependencies** - If seed B depends on seed A, make sure A has a lower number

## Environment Variables Required

```bash
CORE_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
```
