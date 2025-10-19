#!/usr/bin/env node

/**
 * Database Creation Script
 * 
 * Creates all PostgreSQL databases for the Atriz monorepo:
 * - atriz_shared (shared user/auth database)
 * - atriz_db (Atriz app database)
 * - mextrack_db (Mextrack app database)
 * - pshop_db (PShop app database)
 * 
 * Usage:
 *   node scripts/create-databases.js
 *   pnpm db:create
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

// Databases to create
const DATABASES = [
  {
    name: 'atriz_shared',
    description: 'Shared database for user authentication and authorization',
  },
  {
    name: 'atriz_db',
    description: 'Atriz application database',
  },
  {
    name: 'mextrack_db',
    description: 'Mextrack fleet tracking database',
  },
  {
    name: 'pshop_db',
    description: 'PShop point-of-sale database',
  },
];

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
 * Create a database
 */
async function createDatabase(client, dbName, description) {
  const exists = await databaseExists(client, dbName);
  
  if (exists) {
    console.log(`  ℹ Database "${dbName}" already exists, skipping...`);
    return false;
  }
  
  await client.query(`CREATE DATABASE ${dbName}`);
  console.log(`  ✓ Created database "${dbName}" - ${description}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Atriz Database Creation');
  console.log('='.repeat(60));
  console.log(`PostgreSQL Host: ${DEFAULT_CONFIG.host}:${DEFAULT_CONFIG.port}`);
  console.log(`PostgreSQL User: ${DEFAULT_CONFIG.user}`);
  console.log('='.repeat(60));
  console.log('');
  
  const client = new Client(DEFAULT_CONFIG);
  
  try {
    // Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected to PostgreSQL\n');
    
    // Create databases
    console.log('Creating databases...');
    let createdCount = 0;
    
    for (const db of DATABASES) {
      const created = await createDatabase(client, db.name, db.description);
      if (created) createdCount++;
    }
    
    console.log('');
    console.log('='.repeat(60));
    if (createdCount > 0) {
      console.log(`✓ Successfully created ${createdCount} database(s)!`);
    } else {
      console.log('ℹ All databases already exist.');
    }
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('  1. Configure your .env files with database URLs');
    console.log('  2. Run migrations: pnpm db:migrate:core');
    console.log('  3. Run app migrations: pnpm db:migrate');
    console.log('  4. (Optional) Seed data: pnpm db:seed');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('✗ Error creating databases:');
    console.error(error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  - Ensure PostgreSQL is running');
    console.error('  - Check your connection credentials');
    console.error('  - Verify your user has CREATE DATABASE privileges');
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
main();

