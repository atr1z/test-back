# Core Database Seeds

This directory contains TypeScript seed files for the **core database**.

## Creating a Seed

Create a TypeScript file with a numeric prefix:

```typescript
// 001_seed_users.ts
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

## Running Seeds

From the **root** of the project:

```bash
pnpm db:seed:core
```

From the **packages/core** directory:

```bash
pnpm db:seed
```

## Environment Variables Required

```bash
CORE_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
```

## Seed Execution Order

Seeds are executed in alphabetical order by filename. Use numeric prefixes to control execution order:

- `001_seed_users.ts`
- `002_seed_roles.ts`
- `003_seed_user_roles.ts`
