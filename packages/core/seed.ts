#!/usr/bin/env node

/**
 * Seed runner for @atriz/core (shared database)
 * 
 * This script runs seed files for the shared database.
 * Seeds are executed in alphabetical order.
 * 
 * Usage:
 *   pnpm seed    # Run all seed files
 */

import { runSeeds } from '@atriz/database';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const databaseUrl = process.env.SHARED_DATABASE_URL;

if (!databaseUrl) {
    console.error('Error: SHARED_DATABASE_URL environment variable is not set');
    console.log('Please set SHARED_DATABASE_URL in your .env file');
    process.exit(1);
}

const seedsDir = resolve(__dirname, 'seeds');

console.log('='.repeat(60));
console.log('Atriz Core Seeds (Shared Database)');
console.log('='.repeat(60));
console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
console.log(`Seeds directory: ${seedsDir}`);
console.log('='.repeat(60));
console.log('');

runSeeds({
    databaseUrl,
    seedsDir,
})
    .then((count) => {
        console.log('');
        console.log(`✓ Seeding completed! ${count} file(s) executed.`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('');
        console.error('✗ Seeding failed:', error);
        process.exit(1);
    });

