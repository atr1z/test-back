# Database Scripts

This directory contains utility scripts for managing the Atriz monorepo databases.

## Scripts

### create-databases.js

Creates PostgreSQL databases for the Atriz monorepo.

**Usage:**
```bash
# Create specific database
node scripts/create-databases.js <database-name>

# Or use npm scripts
pnpm db:create                # Create all databases (default)
pnpm db:create:core           # Create core/shared database only
pnpm db:create:atriz          # Create Atriz app database only
pnpm db:create:mextrack       # Create Mextrack app database only
pnpm db:create:pshop          # Create PShop app database only
```

**Available database names:**
- `core` - Core/shared authentication database (`atriz_core`)
- `atriz` - Atriz application database (`atriz_db`)
- `mextrack` - Mextrack application database (`mextrack_db`)
- `pshop` - PShop application database (`pshop_db`)
- `all` - All databases (default if no argument)

**What it does:**
- Creates the specified database(s)
- Skips databases that already exist
- Shows context-specific next steps based on what was created

**Example:**
```bash
# Create only the Mextrack database
pnpm db:create:mextrack

# Then run migrations for that database
pnpm db:migrate:mextrack
```

### clean-database.js

Truncates all tables in PostgreSQL databases. **This deletes all data but preserves the database structure!**

**Usage:**
```bash
# Clean specific database
node scripts/clean-database.js <database-name>

# Or use npm scripts
pnpm db:clean                # Clean all databases
pnpm db:clean:core           # Clean core/shared database only
pnpm db:clean:atriz          # Clean Atriz app database only
pnpm db:clean:mextrack       # Clean Mextrack app database only
pnpm db:clean:pshop          # Clean PShop app database only
```

**Available database names:**
- `core` - Core/shared authentication database (`atriz_shared`) managed by `@atriz/core`
- `atriz` - Atriz application database (`atriz_db`)
- `mextrack` - Mextrack application database (`mextrack_db`)
- `pshop` - PShop application database (`pshop_db`)
- `all` - All databases

**What it does:**
1. Connects to each database
2. Finds all tables in the `public` schema
3. Truncates all tables with `CASCADE` (removes all data)
4. Resets auto-increment sequences
5. **Preserves** database structure (tables, columns, indexes, migrations)

**Example workflow:**
```bash
# Clean Mextrack database (removes data, keeps structure)
pnpm db:clean:mextrack

# No need to re-run migrations! Just re-seed:
pnpm db:seed:mextrack
```

**Benefits:**
- ✅ Faster than drop/recreate (no need to rebuild structure)
- ✅ Preserves migration history
- ✅ No permission issues with recreating databases
- ✅ Can immediately re-seed without running migrations

## Requirements

- PostgreSQL 12+ installed and running
- Node.js 18+
- `pg` and `dotenv` npm packages (installed as devDependencies)
- `.env` file with PostgreSQL credentials (see Configuration below)

## Configuration

The scripts automatically load credentials from multiple sources in priority order:

### Priority Order

1. **Root `.env` file** - Direct PostgreSQL credentials (highest priority)
2. **`packages/core/.env`** - Parsed from `DATABASE_URL` or `SHARED_DATABASE_URL`
3. **Default values** - `postgres/postgres@localhost:5432` (fallback)

### Option 1: Root .env (Recommended for Development)

**Best for:** Local development with standard PostgreSQL setup

```bash
# 1. Copy the template
cp env.example .env

# 2. Edit with your credentials
nano .env
```

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
```

### Option 2: Use App's DATABASE_URL (No extra config needed!)

**Best for:** Using existing app configuration

If you already have `packages/core/.env` with a `SHARED_DATABASE_URL`, the scripts will automatically parse credentials from it!

```env
# In packages/core/.env
SHARED_DATABASE_URL=postgresql://user:pass@host:port/database
```

The script will extract:
- `PGHOST` from the URL host
- `PGPORT` from the URL port
- `PGUSER` from the URL username
- `PGPASSWORD` from the URL password

### Option 3: Use Defaults

**Best for:** Quick start with default PostgreSQL installation

If no `.env` files exist, the scripts use:
```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
```

### Credential Variables

- `PGHOST` - PostgreSQL server host
- `PGPORT` - PostgreSQL server port
- `PGUSER` - PostgreSQL user (must have CREATE DATABASE privileges)
- `PGPASSWORD` - PostgreSQL password

**Important:** These are PostgreSQL **server** credentials used to create/drop databases, not the individual app database URLs.

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

