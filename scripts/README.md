# Database Scripts

This directory contains utility scripts for managing the Atriz monorepo databases.

## Scripts

### create-databases.js

Creates all PostgreSQL databases for the Atriz monorepo.

**Usage:**
```bash
node scripts/create-databases.js
# or
pnpm db:create
```

**What it does:**
- Creates `atriz_shared` (shared authentication database)
- Creates `atriz_db` (Atriz app database)
- Creates `mextrack_db` (Mextrack app database)
- Creates `pshop_db` (PShop app database)
- Skips databases that already exist

### clean-database.js

Drops and recreates PostgreSQL databases. **This is a destructive operation that will DELETE ALL DATA!**

**Usage:**
```bash
# Clean specific database
node scripts/clean-database.js <database-name>

# Or use npm scripts
pnpm db:clean                # Clean all databases
pnpm db:clean:shared         # Clean shared database only
pnpm db:clean:atriz          # Clean Atriz app database only
pnpm db:clean:mextrack       # Clean Mextrack app database only
pnpm db:clean:pshop          # Clean PShop app database only
```

**Available database names:**
- `shared` - Shared authentication database (`atriz_shared`)
- `atriz` - Atriz application database (`atriz_db`)
- `mextrack` - Mextrack application database (`mextrack_db`)
- `pshop` - PShop application database (`pshop_db`)
- `all` - All databases

**What it does:**
1. Terminates all active connections to the database
2. Drops the database
3. Recreates the database
4. Shows next steps for running migrations

**Example workflow:**
```bash
# Clean Mextrack database
pnpm db:clean:mextrack

# Run migrations
pnpm db:migrate:mextrack

# (Optional) Seed data
pnpm db:seed:mextrack
```

## Requirements

- PostgreSQL 12+ installed and running
- Node.js 18+
- `pg` npm package (installed as devDependency)
- Proper PostgreSQL credentials (default: postgres/postgres)

## Configuration

Database connection is configured via environment variables:

- `PGHOST` - PostgreSQL host (default: localhost)
- `PGPORT` - PostgreSQL port (default: 5432)
- `PGUSER` - PostgreSQL user (default: postgres)
- `PGPASSWORD` - PostgreSQL password (default: postgres)

## Safety

⚠️ **Warning**: The `clean-database.js` script is destructive and will permanently delete all data in the specified database(s). Use with caution and **NEVER** run this in production!

The scripts are designed for development use only.

## Troubleshooting

### Connection Errors

If you get connection errors:
1. Ensure PostgreSQL is running
2. Check your connection credentials
3. Verify your user has CREATE/DROP DATABASE privileges

### "Database in use" Errors

If you can't drop a database because it's in use:
1. Close all connections to the database
2. The `clean-database.js` script automatically terminates connections
3. If it still fails, manually check with:
   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'your_database_name';
   ```

### Permission Errors

Ensure your PostgreSQL user has the necessary privileges:
```sql
ALTER USER postgres WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE atriz_shared TO postgres;
```

