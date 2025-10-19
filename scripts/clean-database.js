#!/usr/bin/env node

/**
 * Database Cleanup Script
 * 
 * Drops and recreates PostgreSQL databases for the Atriz monorepo.
 * This will DELETE ALL DATA in the specified database(s)!
 * 
 * Usage:
 *   node scripts/clean-database.js <database-name>
 *   node scripts/clean-database.js shared        - Clean shared database
 *   node scripts/clean-database.js atriz         - Clean Atriz app database
 *   node scripts/clean-database.js mextrack      - Clean Mextrack app database
 *   node scripts/clean-database.js pshop         - Clean PShop app database
 *   node scripts/clean-database.js all           - Clean all databases
 * 
 * Requirements:
 *   - PostgreSQL installed and running
 *   - pg npm package installed
 *   - Connection credentials in environment variables or defaults
 */

const { Client } = require('pg');

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
  shared: {
    name: 'atriz_shared',
    description: 'Shared database for user authentication and authorization',
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
 * Check if database exists
 */
async function databaseExists(client, dbName) {
  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );
  return result.rows.length > 0;
}

/**
 * Terminate all connections to a database
 */
async function terminateConnections(client, dbName) {
  try {
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName]);
    console.log(`  ✓ Terminated all connections to "${dbName}"`);
  } catch (error) {
    console.log(`  ⚠ Warning: Could not terminate connections to "${dbName}": ${error.message}`);
  }
}

/**
 * Drop a database
 */
async function dropDatabase(client, dbName) {
  const exists = await databaseExists(client, dbName);
  
  if (!exists) {
    console.log(`  ℹ Database "${dbName}" does not exist, skipping drop...`);
    return false;
  }
  
  // Terminate all connections first
  await terminateConnections(client, dbName);
  
  // Drop the database
  await client.query(`DROP DATABASE ${dbName}`);
  console.log(`  ✓ Dropped database "${dbName}"`);
  return true;
}

/**
 * Create a database
 */
async function createDatabase(client, dbName, description) {
  await client.query(`CREATE DATABASE ${dbName}`);
  console.log(`  ✓ Created database "${dbName}" - ${description}`);
}

/**
 * Clean (drop and recreate) a database
 */
async function cleanDatabase(client, dbInfo) {
  console.log(`\nCleaning database: ${dbInfo.name}`);
  console.log('  Description:', dbInfo.description);
  
  await dropDatabase(client, dbInfo.name);
  await createDatabase(client, dbInfo.name, dbInfo.description);
  
  console.log(`  ✓ Successfully cleaned "${dbInfo.name}"`);
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
    console.error('  shared     - Clean shared database');
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
  console.error('\nAvailable databases: shared, atriz, mextrack, pshop, all');
  process.exit(1);
}

/**
 * Confirm destructive action
 */
function showWarning(databases) {
  console.log('⚠️  WARNING: This will DELETE ALL DATA in the following database(s):');
  databases.forEach(db => {
    console.log(`   - ${db.name}`);
  });
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
  
  const client = new Client(DEFAULT_CONFIG);
  
  try {
    // Connect to PostgreSQL
    console.log('\nConnecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected to PostgreSQL');
    
    // Clean databases
    for (const db of databases) {
      await cleanDatabase(client, db);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✓ Successfully cleaned ${databases.length} database(s)!`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    
    if (databases.some(db => db.name === 'atriz_shared')) {
      console.log('  1. Run core migrations: pnpm db:migrate:core');
      console.log('  2. Seed core data: pnpm db:seed:core');
    }
    
    databases.forEach(db => {
      if (db.name !== 'atriz_shared') {
        const appName = Object.keys(DATABASE_MAP).find(key => DATABASE_MAP[key].name === db.name);
        if (appName && appName !== 'shared') {
          console.log(`  3. Run ${appName} migrations: pnpm db:migrate:${appName}`);
          console.log(`  4. (Optional) Seed ${appName} data: pnpm db:seed:${appName}`);
        }
      }
    });
    
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('✗ Error cleaning database:');
    console.error(error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  - Ensure PostgreSQL is running');
    console.error('  - Check your connection credentials');
    console.error('  - Verify your user has DROP/CREATE DATABASE privileges');
    console.error('  - Make sure no applications are connected to the database');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
main();

