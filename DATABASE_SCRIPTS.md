# Database Management Scripts

Quick reference guide for managing Atriz monorepo databases.

## Available Commands

### Database Creation

```bash
# Create all databases
pnpm db:create
```

### Database Cleaning (Development Only)

⚠️ **WARNING**: These commands will DELETE ALL DATA!

```bash
# Clean all databases
pnpm db:clean

# Clean specific databases
pnpm db:clean:shared      # Clean shared auth database
pnpm db:clean:atriz       # Clean Atriz app database
pnpm db:clean:mextrack    # Clean Mextrack app database
pnpm db:clean:pshop       # Clean PShop app database
```

### Migrations

```bash
# Run all migrations
pnpm db:migrate

# Run specific migrations
pnpm db:migrate:core      # Shared database migrations
pnpm db:migrate:atriz     # Atriz app migrations
pnpm db:migrate:mextrack  # Mextrack app migrations
pnpm db:migrate:pshop     # PShop app migrations
```

### Seeding

```bash
# Seed all databases
pnpm db:seed

# Seed specific databases
pnpm db:seed:core         # Shared database seed
pnpm db:seed:atriz        # Atriz app seed
pnpm db:seed:mextrack     # Mextrack app seed
pnpm db:seed:pshop        # PShop app seed
```

## Common Workflows

### Initial Setup

```bash
# 1. Create databases
pnpm db:create

# 2. Run migrations
pnpm db:migrate:core
pnpm db:migrate

# 3. Seed data (optional)
pnpm db:seed:core
pnpm db:seed
```

### Reset a Single App Database

```bash
# Example: Reset Mextrack database
pnpm db:clean:mextrack
pnpm db:migrate:mextrack
pnpm db:seed:mextrack
```

### Reset All Databases

```bash
# WARNING: Deletes all data!
pnpm db:clean
pnpm db:migrate:core
pnpm db:migrate
pnpm db:seed:core
pnpm db:seed
```

### Reset Shared Database Only

```bash
# WARNING: This affects all apps!
pnpm db:clean:shared
pnpm db:migrate:core
pnpm db:seed:core
```

## Database Information

| Database | App | Purpose |
|----------|-----|---------|
| `atriz_shared` | Core | Shared authentication & users |
| `atriz_db` | Atriz | Atriz app data |
| `mextrack_db` | Mextrack | Fleet tracking data |
| `pshop_db` | PShop | Point-of-sale data |

## Environment Configuration

Each package needs a `.env` file with database URLs:

**Core Package** (`packages/core/.env`):
```env
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_shared
```

**App Packages** (`apps/{app}/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{app}_db
SHARED_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atriz_shared
```

## Requirements

- PostgreSQL 12+ running
- Node.js 18+
- pnpm 8+

## Troubleshooting

### "Database does not exist"

```bash
pnpm db:create
```

### "Connection refused"

- Check PostgreSQL is running: `pg_isready`
- Verify connection credentials

### "Permission denied"

```sql
ALTER USER postgres WITH CREATEDB;
```

### Need to start fresh?

```bash
# Nuclear option - reset everything
pnpm db:clean
pnpm db:create
pnpm db:migrate:core
pnpm db:migrate
pnpm db:seed:core
pnpm db:seed
```

## More Information

For detailed architecture and migration guides, see:
- `.cascade/DATABASE.md` - Complete database documentation
- `scripts/README.md` - Script implementation details

