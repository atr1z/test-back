#!/usr/bin/env node

/**
 * Database Cleanup Script
 * 
 * Deletes all data from tables in PostgreSQL databases for the Atriz monorepo.
 * This will DELETE ALL DATA but preserve the database structure and migrations!
 * 
 * Usage:
 *   node scripts/clean-database.js <database-name>
 *   node scripts/clean-database.js core          - Clean core/shared database
 *   node scripts/clean-database.js atriz         - Clean Atriz app database
 *   node scripts/clean-database.js mextrack      - Clean Mextrack app database
 *   node scripts/clean-database.js pshop         - Clean PShop app database
 *   node scripts/clean-database.js all           - Clean all databases
 * 
 * What it does:
 *   - Truncates all tables in the database (removes all rows)
 *   - Preserves database structure (tables, columns, indexes)
 *   - Resets auto-increment sequences
 *   - Does NOT drop or recreate the database
 * 
 * Requirements:
 *   - PostgreSQL installed and running
 *   - pg npm package installed
 *   - .env file with PostgreSQL credentials (copy from env.example)
 */

const { Client } = require('pg');
const { resolve } = require('path');
const { existsSync } = require('fs');

// Load environment variables from multiple sources (priority order)
// 1. Try root .env
const rootEnv = resolve(__dirname, '..', '.env');
if (existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

// 2. Try packages/core/.env (fallback for shared database credentials)
const coreEnv = resolve(__dirname, '..', 'packages', 'core', '.env');
if (existsSync(coreEnv)) {
  require('dotenv').config({ path: coreEnv });
}

/**
 * Parse PostgreSQL connection details from DATABASE_URL
 */
function parseConnectionUrl(url) {
  if (!url) return null;
  
  try {
    // Parse postgresql://user:password@host:port/database
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\//);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4], 10),
      };
    }
  } catch (error) {
    return null;
  }
  return null;
}

// 3. If no PG* variables, try parsing from SHARED_DATABASE_URL or DATABASE_URL
if (!process.env.PGHOST && !process.env.PGUSER) {
  const dbUrl = process.env.SHARED_DATABASE_URL || process.env.DATABASE_URL;
  const parsed = parseConnectionUrl(dbUrl);
  if (parsed) {
    process.env.PGHOST = process.env.PGHOST || parsed.host;
    process.env.PGPORT = process.env.PGPORT || parsed.port.toString();
    process.env.PGUSER = process.env.PGUSER || parsed.user;
    process.env.PGPASSWORD = process.env.PGPASSWORD || parsed.password;
  }
}

// Default PostgreSQL connection (connects to postgres database)
const DEFAULT_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: 'postgres', // Connect to default postgres database
};

// Database mapping
const DATABASE_MAP = {
  core: {
    name: 'atriz_core',
    description: 'Core shared database for user authentication and authorization',
  },
  atriz: {
    name: 'atriz_db',
    description: 'Atriz application database',
  },
  mextrack: {
    name: 'mextrack_db',
    description: 'Mextrack fleet tracking database',
  },
  pshop: {
    name: 'pshop_db',
    description: 'PShop point-of-sale database',
  },
};

/**
 * Get all tables in a database schema
 */
async function getTables(client) {
  const result = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  return result.rows.map(row => row.tablename);
}

/**
 * Truncate all tables in a database
 */
async function truncateAllTables(client) {
  const tables = await getTables(client);
  
  if (tables.length === 0) {
    console.log('  ℹ No tables found in database');
    return 0;
  }
  
  console.log(`  Found ${tables.length} table(s): ${tables.join(', ')}`);
  
  // Disable triggers and truncate all tables in one command
  // CASCADE removes data from dependent tables
  // RESTART IDENTITY resets auto-increment sequences
  const tableList = tables.map(t => `"${t}"`).join(', ');
  
  try {
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
    console.log(`  ✓ Truncated ${tables.length} table(s)`);
    return tables.length;
  } catch (error) {
    // If TRUNCATE fails (e.g., no tables), try individual deletes
    console.log('  ⚠ Truncate failed, trying individual table cleanup...');
    let cleaned = 0;
    for (const table of tables) {
      try {
        await client.query(`DELETE FROM "${table}"`);
        cleaned++;
      } catch (err) {
        console.log(`  ⚠ Could not clean table "${table}": ${err.message}`);
      }
    }
    console.log(`  ✓ Cleaned ${cleaned}/${tables.length} table(s)`);
    return cleaned;
  }
}

/**
 * Clean (truncate all tables) in a database
 */
async function cleanDatabase(dbInfo) {
  console.log(`\nCleaning database: ${dbInfo.name}`);
  console.log('  Description:', dbInfo.description);
  
  // Create a new client connected to the specific database
  const dbClient = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: dbInfo.name,
  });
  
  try {
    await dbClient.connect();
    console.log(`  ✓ Connected to "${dbInfo.name}"`);
    
    const tablesCount = await truncateAllTables(dbClient);
    
    console.log(`  ✓ Successfully cleaned "${dbInfo.name}"`);
    return tablesCount;
  } catch (error) {
    if (error.code === '3D000') {
      // Database doesn't exist
      console.log(`  ⚠ Database "${dbInfo.name}" does not exist, skipping...`);
      return 0;
    }
    throw error;
  } finally {
    await dbClient.end();
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Database name required');
    console.error('\nUsage:');
    console.error('  node scripts/clean-database.js <database-name>');
    console.error('\nAvailable databases:');
    console.error('  core       - Clean core/shared database (@atriz/core)');
    console.error('  atriz      - Clean Atriz app database');
    console.error('  mextrack   - Clean Mextrack app database');
    console.error('  pshop      - Clean PShop app database');
    console.error('  all        - Clean all databases');
    process.exit(1);
  }
  
  return args[0].toLowerCase();
}

/**
 * Get databases to clean based on argument
 */
function getDatabasesToClean(target) {
  if (target === 'all') {
    return Object.values(DATABASE_MAP);
  }
  
  if (DATABASE_MAP[target]) {
    return [DATABASE_MAP[target]];
  }
  
  console.error(`Error: Unknown database "${target}"`);
  console.error('\nAvailable databases: core, atriz, mextrack, pshop, all');
  process.exit(1);
}

/**
 * Confirm destructive action
 */
function showWarning(databases) {
  console.log('⚠️  WARNING: This will DELETE ALL DATA (but preserve structure) in:');
  databases.forEach(db => {
    console.log(`   - ${db.name} (${db.description})`);
  });
  console.log('');
  console.log('What will happen:');
  console.log('  ✓ All table data will be deleted (TRUNCATE)');
  console.log('  ✓ Auto-increment sequences will be reset');
  console.log('  ✓ Database structure will be preserved (tables, indexes, etc.)');
  console.log('  ✓ Migration history will be preserved');
  console.log('');
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Atriz Database Cleanup');
  console.log('='.repeat(60));
  
  const target = parseArguments();
  const databases = getDatabasesToClean(target);
  
  showWarning(databases);
  
  console.log(`PostgreSQL Host: ${DEFAULT_CONFIG.host}:${DEFAULT_CONFIG.port}`);
  console.log(`PostgreSQL User: ${DEFAULT_CONFIG.user}`);
  console.log('='.repeat(60));
  
  try {
    // Show credentials
    console.log('\nUsing PostgreSQL credentials:');
    console.log('  PGHOST:', process.env.PGHOST || 'localhost (default)');
    console.log('  PGPORT:', process.env.PGPORT || '5432 (default)');
    console.log('  PGUSER:', process.env.PGUSER || 'postgres (default)');
    console.log('  PGPASSWORD:', process.env.PGPASSWORD ? '***' : 'postgres (default)');
    
    // Show credential source
    if (existsSync(rootEnv)) {
      console.log('  Source: .env file');
    } else if (process.env.SHARED_DATABASE_URL || process.env.DATABASE_URL) {
      console.log('  Source: Parsed from DATABASE_URL');
    } else {
      console.log('  Source: Default values');
    }
    console.log('');
    
    // Clean databases
    let totalTables = 0;
    for (const db of databases) {
      const tables = await cleanDatabase(db);
      totalTables += tables;
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✓ Successfully cleaned ${databases.length} database(s)!`);
    console.log(`  Truncated ${totalTables} total table(s)`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('  The database structure is preserved, so you can:');
    
    if (databases.some(db => db.name === 'atriz_core')) {
      console.log('  1. Seed core data: pnpm db:seed:core');
    }
    
    databases.forEach(db => {
      if (db.name !== 'atriz_core') {
        const appName = Object.keys(DATABASE_MAP).find(key => DATABASE_MAP[key].name === db.name);
        if (appName && appName !== 'core') {
          console.log(`  2. Seed ${appName} data: pnpm db:seed:${appName}`);
        }
      }
    });
    
    console.log('');
    console.log('  Or if you need to reset migrations:');
    console.log('  1. Drop the database: psql -c "DROP DATABASE <db_name>"');
    console.log('  2. Create: pnpm db:create');
    console.log('  3. Migrate: pnpm db:migrate:core && pnpm db:migrate');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('✗ Error cleaning database:');
    console.error(error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  - Ensure PostgreSQL is running');
    console.error('  - Check your connection credentials');
    console.error('  - Verify database exists (run: pnpm db:create)');
    console.error('  - Verify your user has access to the database');
    console.error('');
    process.exit(1);
  }
}

// Run the script
main();

