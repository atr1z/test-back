import request from 'supertest';
import { Express } from 'express';
import { expect } from 'vitest';
import { JWTService, PasswordService } from '@atriz/auth';
import { DatabasePool } from '@atriz/database';

/**
 * E2E Test Helpers
 * Reusable utilities for end-to-end testing
 */

/**
 * Generate a test JWT token for authenticated requests
 */
export function generateTestToken(userId: string, email: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in test environment');
    }

    const jwtService = new JWTService(jwtSecret);
    return jwtService.generateToken({ userId, email });
}

/**
 * Create a test user in the shared database
 * Note: Uses the shared atriz_core database for authentication
 */
export async function createTestUser(
    db: DatabasePool,
    data: {
        email: string;
        password: string;
        name: string;
    }
) {
    const passwordService = new PasswordService();
    const passwordHash = await passwordService.hashPassword(data.password);

    // Insert into shared auth database
    // Note: You may need to connect to SHARED_DATABASE_URL for this
    const result = await db.query(
        `INSERT INTO users (email, password_hash, name, email_verified, is_active)
     VALUES ($1, $2, $3, true, true)
     RETURNING id, email, name, created_at`,
        [data.email, passwordHash, data.name]
    );

    return result.rows[0];
}

/**
 * Create authenticated request helper
 * Provides convenient methods for making authenticated requests
 */
export function authenticatedRequest(app: Express, token: string) {
    return {
        get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),

        post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),

        put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),

        delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),

        patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    };
}

/**
 * Seed test data helper - Vehicle
 */
export async function seedTestVehicle(
    db: DatabasePool,
    userId: string,
    data: Partial<{
        licensePlate: string;
        make: string;
        model: string;
        year: number;
        color: string;
        vin: string;
    }> = {}
) {
    const result = await db.query(
        `INSERT INTO vehicles (user_id, license_plate, make, model, year, color, vin, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
        [
            userId,
            data.licensePlate || 'TEST-123',
            data.make || 'Toyota',
            data.model || 'Camry',
            data.year || 2023,
            data.color || 'Silver',
            data.vin || 'TEST' + Math.random().toString(36).substring(2, 15).toUpperCase(),
        ]
    );

    return result.rows[0];
}

/**
 * Seed test data helper - Driver
 */
export async function seedTestDriver(
    db: DatabasePool,
    userId: string,
    data: Partial<{
        name: string;
        licenseNumber: string;
        phone: string;
    }> = {}
) {
    const result = await db.query(
        `INSERT INTO drivers (user_id, name, license_number, phone, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
        [
            userId,
            data.name || 'Test Driver',
            data.licenseNumber || 'DL' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            data.phone || '+1234567890',
        ]
    );

    return result.rows[0];
}

/**
 * Assert API error response
 */
export function expectApiError(
    response: request.Response,
    statusCode: number,
    messageContains?: string
) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');

    if (messageContains) {
        expect(response.body.message.toLowerCase()).toContain(messageContains.toLowerCase());
    }
}

/**
 * Assert API success response
 */
export function expectApiSuccess(response: request.Response, statusCode: number = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
}

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const result = await condition();
        if (result) return;
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(prefix: string = 'test'): string {
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${random}@mextrack.test`;
}

/**
 * Generate random string for testing
 */
export function randomString(length: number = 8): string {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length)
        .toUpperCase();
}
