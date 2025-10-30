import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

// Global test setup
beforeAll(async () => {
    // Set up any global test configuration
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret-key-for-testing-only';
    process.env['JWT_EXPIRES_IN'] = '1h';
    process.env['DATABASE_URL'] =
        'postgresql://test:test@localhost:5432/test_db';
    process.env['REDIS_URL'] = 'redis://localhost:6379';
});

afterAll(async () => {
    // Clean up any global resources
});

beforeEach(() => {
    // Reset any mocks or state before each test
});

afterEach(() => {
    // Clean up after each test
});
