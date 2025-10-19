# @atriz/database

Database utilities and connection management for the Atriz Framework.

## Features

- PostgreSQL connection pooling
- Transaction support
- Migration management with node-pg-migrate
- Seed data utilities
- Full TypeScript support
- No ORM - complete SQL control

## Installation

This package is part of the Atriz monorepo and is used internally.

```bash
pnpm add @atriz/database
```

## Usage

### Database Connection

```typescript
import { createDatabasePool } from '@atriz/database';

const db = createDatabasePool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Query the database
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Close connection
await db.close();
```

### Transactions

```typescript
import { withTransaction } from '@atriz/database';

const result = await withTransaction(db.pool, async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
  await client.query('INSERT INTO logs (action) VALUES ($1)', ['user_created']);
  return { success: true };
});
```

### Migrations

```typescript
import { runMigrations } from '@atriz/database';

await runMigrations({
  databaseUrl: process.env.DATABASE_URL,
  migrationsDir: './migrations',
  direction: 'up',
});
```

### Seeds

```typescript
import { runSeeds, SeedFunction } from '@atriz/database';

// Run all seeds
await runSeeds({
  databaseUrl: process.env.DATABASE_URL,
  seedsDir: './seeds',
});

// Create a seed file (001_seed_users.ts)
const seed: SeedFunction = async (pool) => {
  await pool.query(`
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
  `, ['admin@example.com', 'hash', 'Admin']);
};

export default seed;
```

## API

See TypeScript definitions for complete API documentation.

## License

Private - Part of Atriz Framework

