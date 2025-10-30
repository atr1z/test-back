# Atriz App Database Seeds

This directory contains seed files for the **Atriz application database**.

## Creating a Seed

From the **root** of the project:

```bash
pnpm db:seed:create:atriz seed_profiles
```

From the **apps/atriz** directory:

```bash
pnpm db:seed:create seed_profiles
```

This will create a numbered seed file like `001_seed_profiles.ts`.

## Running Seeds

From the **root** of the project:

```bash
pnpm db:seed:atriz
```

From the **apps/atriz** directory:

```bash
pnpm db:seed
```

## Seed File Format

Seed files are TypeScript modules that export a default function:

```typescript
import { Pool } from 'pg';

export default async (pool: Pool) => {
    await pool.query(`
        INSERT INTO user_profiles (user_id, bio, avatar_url, preferences) VALUES
        ('user-id-1', 'Example bio', 'https://example.com/avatar.jpg', '{}')
        ON CONFLICT (user_id) DO NOTHING
    `);
};
```

## Environment Variables Required

```bash
ATRIZ_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_db
```
