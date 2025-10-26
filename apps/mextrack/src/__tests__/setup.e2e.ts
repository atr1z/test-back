import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createDatabasePool, DatabasePool } from '@atriz/database';
import { loadEnv } from '@atriz/core';

// Load environment variables
loadEnv();

// Global test database connection
let testDb: DatabasePool | null = null;

/**
 * Setup before all tests
 * - Create database connection
 * - Verify database is accessible
 */
beforeAll(async () => {
    console.log('🔧 Setting up E2E test environment...');

    // Verify we're in test mode
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('E2E tests must run with NODE_ENV=test');
    }

    // Create test database connection
    testDb = createDatabasePool({
        connectionString: process.env.DATABASE_URL,
        max: 5, // Smaller pool for tests
    });

    // Verify connection
    await testDb.query('SELECT 1');
    console.log('✅ Test database connected');
});

/**
 * Cleanup before each test
 * - Truncate tables to ensure clean state
 * - Each test starts with a fresh database
 */
beforeEach(async () => {
    if (!testDb) return;

    try {
        // Truncate all tables (preserve structure)
        // Add your application tables here
        await testDb.query(`
      TRUNCATE TABLE 
        vehicles,
        drivers,
        routes
      RESTART IDENTITY CASCADE
    `);
    } catch (error) {
        console.warn('Warning: Could not truncate tables. Some tables may not exist yet.');
        // Don't fail the test if tables don't exist (useful for initial setup)
    }
});

/**
 * Cleanup after all tests
 * - Close database connection
 * - Free up resources
 */
afterAll(async () => {
    if (testDb) {
        await testDb.close();
        console.log('✅ Test database connection closed');
    }
});

// Export for use in tests
export { testDb };
