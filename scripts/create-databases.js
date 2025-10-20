#!/usr/bin/env node

/**
 * Database Creation Script
 * 
 * Creates PostgreSQL databases for the Atriz monorepo:
 * - atriz_shared (shared user/auth database)
 * - atriz_db (Atriz app database)
 * - mextrack_db (Mextrack app database)
 * - pshop_db (PShop app database)
 * 
 * Usage:
 *   node scripts/create-databases.js [database-name]
 *   node scripts/create-databases.js              # Create all databases
 *   node scripts/create-databases.js shared       # Create shared database
 *   node scripts/create-databases.js atriz        # Create Atriz app database
 *   node scripts/create-databases.js mextrack     # Create Mextrack app database
 *   node scripts/create-databases.js pshop        # Create PShop app database
 *   node scripts/create-databases.js all          # Create all databases
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
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  // If no arguments, default to 'all'
  if (args.length === 0) {
    return 'all';
  }
  
  const target = args[0].toLowerCase();
  
  // Show help if requested
  if (target === '--help' || target === '-h') {
    console.log('Usage:');
    console.log('  node scripts/create-databases.js [database-name]');
    console.log('');
    console.log('Available databases:');
    console.log('  core       - Create core/shared database (@atriz/core)');
    console.log('  atriz      - Create Atriz app database');
    console.log('  mextrack   - Create Mextrack app database');
    console.log('  pshop      - Create PShop app database');
    console.log('  all        - Create all databases (default)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/create-databases.js');
    console.log('  node scripts/create-databases.js core');
    console.log('  node scripts/create-databases.js mextrack');
    process.exit(0);
  }
  
  return target;
}

/**
 * Get databases to create based on argument
 */
function getDatabasesToCreate(target) {
  if (target === 'all') {
    return Object.values(DATABASE_MAP);
  }
  
  if (DATABASE_MAP[target]) {
    return [DATABASE_MAP[target]];
  }
  
  console.error(`Error: Unknown database "${target}"`);
  console.error('');
  console.error('Available databases: core, atriz, mextrack, pshop, all');
  console.error('Use --help for more information');
  process.exit(1);
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Atriz Database Creation');
  console.log('='.repeat(60));
  
  const target = parseArguments();
  const databases = getDatabasesToCreate(target);
  
  if (databases.length === 1) {
    console.log(`Target: ${databases[0].name}`);
  } else {
    console.log(`Target: All databases (${databases.length})`);
  }
  
  console.log(`PostgreSQL Host: ${DEFAULT_CONFIG.host}:${DEFAULT_CONFIG.port}`);
  console.log(`PostgreSQL User: ${DEFAULT_CONFIG.user}`);
  console.log('='.repeat(60));
  console.log('');
  
  const client = new Client(DEFAULT_CONFIG);
  
  try {
    // Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    console.log('Using credentials:');
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
    
    await client.connect();
    console.log('✓ Connected to PostgreSQL\n');
    
    // Create databases
    console.log('Creating databases...');
    let createdCount = 0;
    
    for (const db of databases) {
      const created = await createDatabase(client, db.name, db.description);
      if (created) createdCount++;
    }
    
    console.log('');
    console.log('='.repeat(60));
    if (createdCount > 0) {
      console.log(`✓ Successfully created ${createdCount} database(s)!`);
    } else {
      console.log('ℹ All specified databases already exist.');
    }
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    
    if (databases.some(db => db.name === 'atriz_shared')) {
      console.log('  1. Configure .env: packages/core/.env');
      console.log('  2. Run migrations: pnpm db:migrate:core');
      console.log('  3. Seed data: pnpm db:seed:core');
    }
    
    databases.forEach(db => {
      if (db.name !== 'atriz_shared') {
        const appName = Object.keys(DATABASE_MAP).find(key => DATABASE_MAP[key].name === db.name);
        if (appName && appName !== 'shared') {
          console.log(`  - Configure .env: apps/${appName}/.env`);
          console.log(`  - Run migrations: pnpm db:migrate:${appName}`);
          console.log(`  - (Optional) Seed data: pnpm db:seed:${appName}`);
        }
      }
    });
    
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

