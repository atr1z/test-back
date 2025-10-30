# Tracking Database Seeds

This directory contains seed files for the **tracking database** (TimescaleDB).

## Creating a Seed

From the **root** of the project:

```bash
pnpm db:seed:create:tracking seed_locations
```

From the **packages/core** directory:

```bash
pnpm db:seed:tracking:create seed_locations
```

This will create a numbered seed file like `001_seed_locations.ts`.

## Running Seeds

From the **root** of the project:

```bash
pnpm db:seed:tracking
```

From the **packages/core** directory:

```bash
pnpm db:seed:tracking
```

## Seed File Format

Seed files are TypeScript modules for seeding time-series data:

```typescript
import { Pool } from 'pg';

export default async (pool: Pool) => {
    // Example: Seed historical location data
    await pool.query(`
        INSERT INTO location_events (time, device_id, user_id, latitude, longitude, speed) VALUES
        (NOW() - INTERVAL '1 hour', 'device-001', 'user-001', 40.7128, -74.0060, 60),
        (NOW() - INTERVAL '2 hours', 'device-001', 'user-001', 40.7580, -73.9855, 55),
        (NOW() - INTERVAL '3 hours', 'device-001', 'user-001', 40.7614, -73.9776, 50)
        ON CONFLICT DO NOTHING
    `);
};
```

## Environment Variables Required

```bash
TRACKING_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_tracking
```

## Note

The tracking database uses TimescaleDB for time-series data with automatic retention policies. Seeded data will be subject to the same retention rules as production data.
