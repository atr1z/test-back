# @atriz/database

Database utilities and connection management for the Atriz Framework.

## Features

- PostgreSQL connection pooling
- Transaction support
- Migration management with node-pg-migrate
- Seed data utilities
- **TimescaleDB utilities** for time-series data
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

## TimescaleDB Support

For high-volume time-series data (GPS tracking, IoT sensors, logs), use TimescaleDB utilities:

### Enable TimescaleDB

```typescript
import { createDatabasePool, enableTimescaleDB } from '@atriz/database';

const trackingDb = createDatabasePool({
  connectionString: process.env.TRACKING_DATABASE_URL,
});

// Enable TimescaleDB extension (run once during setup)
await enableTimescaleDB(trackingDb.pool);
```

### Create Hypertable

```typescript
import { createHypertable, addRetentionPolicy, enableCompression } from '@atriz/database';

// Convert regular table to hypertable
await createHypertable(trackingDb.pool, 'location_events', 'time', '1 day');

// Add automatic data retention (auto-delete after 30 days)
await addRetentionPolicy(trackingDb.pool, 'location_events', '30 days');

// Enable compression for data older than 7 days
await enableCompression(
  trackingDb.pool,
  'location_events',
  '7 days',
  ['device_id', 'user_id'],  // segment by
  ['time DESC']               // order by
);
```

### Continuous Aggregates

```typescript
import { createContinuousAggregate } from '@atriz/database';

// Create auto-updating materialized view for hourly stats
await createContinuousAggregate(
  trackingDb.pool,
  'location_hourly',
  `
    SELECT
      time_bucket('1 hour', time) AS hour,
      device_id,
      COUNT(*) as point_count,
      AVG(speed) as avg_speed
    FROM location_events
    GROUP BY hour, device_id
  `,
  '1 year'  // retention period for aggregated data
);
```

### Available TimescaleDB Functions

- `enableTimescaleDB(pool)` - Enable extension
- `createHypertable(pool, tableName, timeColumn, chunkInterval)` - Convert to hypertable
- `addRetentionPolicy(pool, tableName, retentionPeriod)` - Auto-delete old data
- `removeRetentionPolicy(pool, tableName)` - Remove retention policy
- `enableCompression(pool, tableName, compressAfter, segmentBy?, orderBy?)` - Compress old data
- `createContinuousAggregate(pool, viewName, query, retentionPeriod?)` - Pre-computed aggregates
- `getHypertableInfo(pool)` - List hypertables with metadata
- `compressChunks(pool, tableName, olderThan)` - Manually compress chunks

See `.cascade/db.md` for complete TimescaleDB architecture documentation.

## API

See TypeScript definitions for complete API documentation.

## License

Private - Part of Atriz Framework

