#!/usr/bin/env node

/**
 * Migration runner for PShop application
 * 
 * Usage:
 *   pnpm migrate              # Run all pending migrations
 *   pnpm migrate up           # Run migrations up
 *   pnpm migrate down         # Rollback last migration
 *   pnpm migrate down --count=2  # Rollback 2 migrations
 */

import { runMigrations } from '@atriz/database';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set');
  console.log('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const direction = (args[0] === 'down' ? 'down' : 'up') as 'up' | 'down';
const countArg = args.find((arg) => arg.startsWith('--count='));
const count = countArg ? parseInt(countArg.split('=')[1], 10) : undefined;

const migrationsDir = resolve(__dirname, 'migrations');

console.log('='.repeat(60));
console.log('PShop App Migrations');
console.log('='.repeat(60));
console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
console.log(`Direction: ${direction}`);
console.log(`Migrations directory: ${migrationsDir}`);
if (count) {
  console.log(`Count: ${count}`);
}
console.log('='.repeat(60));
console.log('');

runMigrations({
  databaseUrl,
  migrationsDir,
  direction,
  count,
  migrationsTable: 'pgmigrations',
  schema: 'public',
})
  .then(() => {
    console.log('');
    console.log('✓ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('✗ Migration failed:', error);
    process.exit(1);
  });

