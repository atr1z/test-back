# Followsite App Database Seeds

This directory contains TypeScript seed files for the **Followsite application database**.

## Creating a Seed

Create a TypeScript file with a numeric prefix:

```typescript
// 001_seed_vehicles.ts
import { Pool } from 'pg';

export default async (pool: Pool) => {
    await pool.query(`
        INSERT INTO vehicles (license_plate, make, model, year, owner_id) VALUES
        ('ABC123', 'Toyota', 'Camry', 2020, 'user-id-1'),
        ('XYZ789', 'Honda', 'Civic', 2021, 'user-id-2')
        ON CONFLICT (license_plate) DO NOTHING
    `);
};
```

## Running Seeds

From the **root** of the project:

```bash
pnpm db:seed:followsite
```

From the **apps/followsite** directory:

```bash
pnpm db:seed
```

## Environment Variables Required

```bash
FOLLOWSITE_DATABASE_URL=postgresql://user:password@localhost:5432/mextrack_db
```

## Seed Execution Order

Seeds are executed in alphabetical order by filename. Use numeric prefixes to control execution order:

- `001_seed_vehicles.ts`
- `002_seed_drivers.ts`
- `003_seed_routes.ts`
