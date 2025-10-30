import 'reflect-metadata';
import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(() => {
    // Set test environment variables
    process.env['NODE_ENV'] = 'test';
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['JWT_EXPIRES_IN'] = '1h';
    process.env['PORT'] = '3001';
});

afterAll(() => {
    // Cleanup after all tests
});
