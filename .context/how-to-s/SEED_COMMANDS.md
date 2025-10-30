# Database Seed Commands Reference

Complete reference for creating and running database seed files.

## Quick Reference

### Create Seed Files

```bash
# From root directory
pnpm db:seed:create:core seed_users
pnpm db:seed:create:tracking seed_locations
pnpm db:seed:create:atriz seed_profiles
pnpm db:seed:create:followsite seed_vehicles
pnpm db:seed:create:pshop seed_products
```

### Run Seeds

```bash
# From root directory
pnpm db:seed                    # Run all seeds
pnpm db:seed:core              # Core database
pnpm db:seed:tracking          # Tracking database
pnpm db:seed:atriz             # Atriz database
pnpm db:seed:followsite        # Followsite database
pnpm db:seed:pshop             # PShop database
```

## Creating Seed Files

### From Root Directory

```bash
# Core database
pnpm db:seed:create:core <seed-name>

# Tracking database (TimescaleDB)
pnpm db:seed:create:tracking <seed-name>

# Atriz database
pnpm db:seed:create:atriz <seed-name>

# Followsite database
pnpm db:seed:create:followsite <seed-name>

# PShop database
pnpm db:seed:create:pshop <seed-name>
```

### From Package/App Directories

```bash
# From packages/core/
pnpm db:seed:create <seed-name>              # Core database
pnpm db:seed:tracking:create <seed-name>     # Tracking database

# From apps/atriz/
pnpm db:seed:create <seed-name>

# From apps/followsite/
pnpm db:seed:create <seed-name>

# From apps/pshop/
pnpm db:seed:create <seed-name>
```

## Seed File Format

Seed files are automatically created with the correct format:

```typescript
import { Pool } from 'pg';

/**
 * Seed: seed_name
 *
 * Add your seed data here
 */
export default async (pool: Pool) => {
    // Example:
    // await pool.query(`
    //     INSERT INTO table_name (column1, column2) VALUES
    //     ('value1', 'value2'),
    //     ('value3', 'value4')
    //     ON CONFLICT (unique_column) DO NOTHING
    // `);

    console.log('Seed seed_name executed');
};
```

## Naming Convention

Seed files are automatically numbered sequentially:

- First seed: `001_seed_users.ts`
- Second seed: `002_seed_roles.ts`
- Third seed: `003_seed_permissions.ts`

The numbering ensures seeds run in the correct order.

## Example: Creating and Running Seeds

### Step 1: Create a Seed File

```bash
# Create a seed for users
pnpm db:seed:create:core seed_users
```

This creates: `packages/core/seeds/users/001_seed_users.ts`

### Step 2: Edit the Seed File

```typescript
import { Pool } from 'pg';

export default async (pool: Pool) => {
    await pool.query(`
        INSERT INTO users (email, name, password_hash, role, is_active) VALUES
        ('admin@example.com', 'Admin User', '$2b$10$YourHashedPassword', 'admin', true),
        ('user@example.com', 'Regular User', '$2b$10$YourHashedPassword', 'user', true),
        ('guest@example.com', 'Guest User', '$2b$10$YourHashedPassword', 'guest', true)
        ON CONFLICT (email) DO NOTHING
    `);

    console.log('✓ Seeded users');
};
```

### Step 3: Run the Seed

```bash
# Run core seeds
pnpm db:seed:core
```

## Seed Locations

| Database       | Seed Directory                  | Environment Variable                  |
| -------------- | ------------------------------- | ------------------------------------- |
| **core**       | `packages/core/seeds/users/`    | `CORE_DATABASE_URL` or `DATABASE_URL` |
| **tracking**   | `packages/core/seeds/tracking/` | `TRACKING_DATABASE_URL`               |
| **atriz**      | `apps/atriz/seeds/`             | `ATRIZ_DATABASE_URL`                  |
| **followsite** | `apps/followsite/seeds/`        | `FOLLOWSITE_DATABASE_URL`             |
| **pshop**      | `apps/pshop/seeds/`             | `PSHOP_DATABASE_URL`                  |

## Best Practices

### 1. Make Seeds Idempotent

Always use `ON CONFLICT` or `WHERE NOT EXISTS` to allow seeds to run multiple times safely:

```typescript
// Good ✓
await pool.query(`
    INSERT INTO users (email, name) VALUES
    ('admin@example.com', 'Admin')
    ON CONFLICT (email) DO NOTHING
`);

// Or
await pool.query(`
    INSERT INTO users (email, name)
    SELECT 'admin@example.com', 'Admin'
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'admin@example.com'
    )
`);
```

### 2. Use Transactions for Multiple Operations

```typescript
export default async (pool: Pool) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`INSERT INTO categories ...`);
        await client.query(`INSERT INTO products ...`);
        await client.query(`INSERT INTO inventory ...`);

        await client.query('COMMIT');
        console.log('✓ Seeded products with categories');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
```

### 3. Order Dependencies Correctly

If seed B depends on data from seed A, make sure seed A has a lower number:

```
001_seed_users.ts      ← Creates users first
002_seed_roles.ts      ← Creates roles second
003_seed_user_roles.ts ← Assigns roles to users third
```

### 4. Use Environment-Specific Data

```typescript
export default async (pool: Pool) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        // Seed with test data in development
        await pool.query(`
            INSERT INTO users (email, name) VALUES
            ('test1@example.com', 'Test User 1'),
            ('test2@example.com', 'Test User 2')
            ON CONFLICT (email) DO NOTHING
        `);
    } else {
        // Seed with minimal data in production
        await pool.query(`
            INSERT INTO users (email, name) VALUES
            ('admin@company.com', 'System Admin')
            ON CONFLICT (email) DO NOTHING
        `);
    }
};
```

### 5. Generate Realistic Test Data

```typescript
export default async (pool: Pool) => {
    // Generate 100 test users
    const users = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i + 1}@example.com`,
        name: `Test User ${i + 1}`,
        password_hash: '$2b$10$defaulthash',
        role: i === 0 ? 'admin' : 'user',
    }));

    for (const user of users) {
        await pool.query(
            `
            INSERT INTO users (email, name, password_hash, role) VALUES
            ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING
        `,
            [user.email, user.name, user.password_hash, user.role]
        );
    }

    console.log(`✓ Seeded ${users.length} users`);
};
```

## Execution Order

Seeds within each directory are executed in alphabetical order by filename. Use numeric prefixes to control execution order:

```
packages/core/seeds/users/
├── 001_seed_users.ts        ← Runs first
├── 002_seed_roles.ts        ← Runs second
└── 003_seed_permissions.ts  ← Runs third
```

## Environment Variables

Make sure to set the appropriate database URLs before running seeds:

```bash
# Core database
CORE_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/atriz_core

# Tracking database
TRACKING_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_tracking

# App databases
ATRIZ_DATABASE_URL=postgresql://user:password@localhost:5432/atriz_db
FOLLOWSITE_DATABASE_URL=postgresql://user:password@localhost:5432/mextrack_db
PSHOP_DATABASE_URL=postgresql://user:password@localhost:5432/pshop_db
```

## Direct Script Usage

You can also run the seed script directly:

```bash
# Create seed
node scripts/seed.mjs create <database> <seed-name>

# Run seeds
node scripts/seed.mjs run <database>

# Examples
node scripts/seed.mjs create core seed_users
node scripts/seed.mjs run all
```

## Troubleshooting

### Error: "No seeds directory found"

The seeds directory will be created automatically when you create your first seed file.

### Error: "Cannot find module 'pg'"

Make sure the core package is built:

```bash
pnpm build:core
```

### Seeds running out of order

Make sure your seed files use 3-digit numeric prefixes (001, 002, 003) and are sorted correctly.

### Duplicate key errors

Add `ON CONFLICT (unique_column) DO NOTHING` to make your seeds idempotent.

## See Also

- [DATABASE_COMMANDS.md](./DATABASE_COMMANDS.md) - Complete database migration reference
- [QUICK_START.md](./QUICK_START.md) - Quick start guide for database operations
- Individual seed directory README files for specific examples
