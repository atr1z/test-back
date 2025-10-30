# PShop App Database Seeds

This directory contains TypeScript seed files for the **PShop application database**.

## Creating a Seed

Create a TypeScript file with a numeric prefix:

```typescript
// 001_seed_products.ts
import { Pool } from 'pg';

export default async (pool: Pool) => {
    await pool.query(`
        INSERT INTO products (name, description, price, stock, category) VALUES
        ('Product 1', 'Description 1', 19.99, 100, 'Electronics'),
        ('Product 2', 'Description 2', 29.99, 50, 'Clothing')
        ON CONFLICT (name) DO NOTHING
    `);
};
```

## Running Seeds

From the **root** of the project:

```bash
pnpm db:seed:pshop
```

From the **apps/pshop** directory:

```bash
pnpm db:seed
```

## Environment Variables Required

```bash
PSHOP_DATABASE_URL=postgresql://user:password@localhost:5432/pshop_db
```

## Seed Execution Order

Seeds are executed in alphabetical order by filename. Use numeric prefixes to control execution order:

- `001_seed_categories.ts`
- `002_seed_products.ts`
- `003_seed_orders.ts`
