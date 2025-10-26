import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { testDb } from './setup.e2e';
import {
    generateTestToken,
    createTestUser,
    authenticatedRequest,
    seedTestVehicle,
    expectApiError,
    expectApiSuccess,
    generateTestEmail,
} from './helpers.e2e';

// TODO: Import your actual app instance
// After you export webService from src/index.ts, uncomment this:
// import { webService } from '../index';
// const app = webService.app;

// For now, this is a placeholder to prevent build errors
let app: Express = {} as Express; // Replace with actual import
let testUserId: string;
let testToken: string;

describe('Mextrack API - E2E Tests', () => {
    beforeAll(async () => {
        // Create test user
        const user = await createTestUser(testDb!, {
            email: generateTestEmail('e2e'),
            password: 'Test123!@#',
            name: 'E2E Test User',
        });

        testUserId = user.id;
        testToken = generateTestToken(user.id, user.email);
    });

    describe('Health & Info Endpoints', () => {
        it('GET /health - should return healthy status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('GET /api/info - should return API information', async () => {
            const response = await request(app).get('/api/info');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('version');
        });
    });

    describe('Authentication', () => {
        it('should reject unauthenticated requests to protected routes', async () => {
            const response = await request(app).get('/api/vehicles');
            expectApiError(response, 401);
        });

        it('should reject invalid JWT tokens', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', 'Bearer invalid-token-here');

            expectApiError(response, 401);
        });

        it('should accept valid JWT tokens', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${testToken}`);

            // Should not be 401 (could be 200 or other valid status)
            expect(response.status).not.toBe(401);
        });

        it('should reject requests with malformed Authorization header', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', 'InvalidFormat token');

            expectApiError(response, 401);
        });
    });

    describe('Vehicle CRUD Operations', () => {
        it('POST /api/vehicles - should create a new vehicle', async () => {
            const vehicleData = {
                licensePlate: 'ABC-123',
                make: 'Toyota',
                model: 'Camry',
                year: 2023,
                color: 'Silver',
                vin: '1HGBH41JXMN109186',
            };

            const response = await authenticatedRequest(app, testToken)
                .post('/api/vehicles')
                .send(vehicleData);

            expectApiSuccess(response, 201);
            expect(response.body.data).toHaveProperty('vehicle');
            expect(response.body.data.vehicle).toMatchObject({
                licensePlate: vehicleData.licensePlate,
                make: vehicleData.make,
                model: vehicleData.model,
            });
        });

        it('GET /api/vehicles - should list all user vehicles', async () => {
            // Seed some test vehicles
            await seedTestVehicle(testDb!, testUserId);
            await seedTestVehicle(testDb!, testUserId, { licensePlate: 'XYZ-789' });

            const response = await authenticatedRequest(app, testToken).get('/api/vehicles');

            expectApiSuccess(response);
            expect(response.body.data.vehicles).toBeInstanceOf(Array);
            expect(response.body.data.vehicles.length).toBeGreaterThanOrEqual(2);
        });

        it('GET /api/vehicles/:id - should get vehicle by ID', async () => {
            const vehicle = await seedTestVehicle(testDb!, testUserId);

            const response = await authenticatedRequest(app, testToken).get(
                `/api/vehicles/${vehicle.id}`
            );

            expectApiSuccess(response);
            expect(response.body.data.vehicle).toMatchObject({
                id: vehicle.id,
                licensePlate: vehicle.license_plate,
                make: vehicle.make,
                model: vehicle.model,
            });
        });

        it('GET /api/vehicles/:id - should return 404 for non-existent vehicle', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            const response = await authenticatedRequest(app, testToken).get(
                `/api/vehicles/${fakeId}`
            );

            expectApiError(response, 404);
        });

        it('PUT /api/vehicles/:id - should update a vehicle', async () => {
            const vehicle = await seedTestVehicle(testDb!, testUserId);

            const updateData = {
                color: 'Blue',
                notes: 'Updated via E2E test',
            };

            const response = await authenticatedRequest(app, testToken)
                .put(`/api/vehicles/${vehicle.id}`)
                .send(updateData);

            expectApiSuccess(response);
            expect(response.body.data.vehicle).toMatchObject({
                id: vehicle.id,
                color: updateData.color,
            });
        });

        it('DELETE /api/vehicles/:id - should delete a vehicle', async () => {
            const vehicle = await seedTestVehicle(testDb!, testUserId);

            const response = await authenticatedRequest(app, testToken).delete(
                `/api/vehicles/${vehicle.id}`
            );

            expectApiSuccess(response);

            // Verify deletion
            const verifyResponse = await authenticatedRequest(app, testToken).get(
                `/api/vehicles/${vehicle.id}`
            );

            expectApiError(verifyResponse, 404);
        });
    });

    describe('Validation', () => {
        it('should reject vehicle with empty license plate', async () => {
            const invalidData = {
                licensePlate: '',
                make: 'Toyota',
                model: 'Camry',
                year: 2023,
            };

            const response = await authenticatedRequest(app, testToken)
                .post('/api/vehicles')
                .send(invalidData);

            expectApiError(response, 422);
            expect(response.body).toHaveProperty('errors');
        });

        it('should reject vehicle with invalid year', async () => {
            const invalidData = {
                licensePlate: 'ABC-123',
                make: 'Toyota',
                model: 'Camry',
                year: 1800, // Too old
            };

            const response = await authenticatedRequest(app, testToken)
                .post('/api/vehicles')
                .send(invalidData);

            expectApiError(response, 422);
        });

        it('should reject vehicle with missing required fields', async () => {
            const invalidData = {
                licensePlate: 'ABC-123',
                // Missing make, model, year
            };

            const response = await authenticatedRequest(app, testToken)
                .post('/api/vehicles')
                .send(invalidData);

            expectApiError(response, 422);
        });

        it('should reject invalid UUID format in URL params', async () => {
            const response = await authenticatedRequest(app, testToken).get(
                '/api/vehicles/not-a-valid-uuid'
            );

            expectApiError(response, 400);
        });
    });

    describe('Permissions & Authorization', () => {
        it('should not allow accessing other users vehicles', async () => {
            // Create another user
            const otherUser = await createTestUser(testDb!, {
                email: generateTestEmail('other'),
                password: 'Test123!@#',
                name: 'Other User',
            });

            // Create vehicle for other user
            const otherVehicle = await seedTestVehicle(testDb!, otherUser.id);

            // Try to access with our test user token
            const response = await authenticatedRequest(app, testToken).get(
                `/api/vehicles/${otherVehicle.id}`
            );

            expectApiError(response, 403);
        });

        it('should not allow updating other users vehicles', async () => {
            const otherUser = await createTestUser(testDb!, {
                email: generateTestEmail('other2'),
                password: 'Test123!@#',
                name: 'Other User 2',
            });

            const otherVehicle = await seedTestVehicle(testDb!, otherUser.id);

            const response = await authenticatedRequest(app, testToken)
                .put(`/api/vehicles/${otherVehicle.id}`)
                .send({ color: 'Red' });

            expectApiError(response, 403);
        });

        it('should not allow deleting other users vehicles', async () => {
            const otherUser = await createTestUser(testDb!, {
                email: generateTestEmail('other3'),
                password: 'Test123!@#',
                name: 'Other User 3',
            });

            const otherVehicle = await seedTestVehicle(testDb!, otherUser.id);

            const response = await authenticatedRequest(app, testToken).delete(
                `/api/vehicles/${otherVehicle.id}`
            );

            expectApiError(response, 403);
        });
    });

    describe('GPS Tracking', () => {
        it('POST /api/tracking/location - should record vehicle location', async () => {
            const vehicle = await seedTestVehicle(testDb!, testUserId);

            const locationData = {
                vehicleId: vehicle.id,
                latitude: 40.7128,
                longitude: -74.006,
                speed: 65,
                heading: 180,
                accuracy: 10,
            };

            const response = await authenticatedRequest(app, testToken)
                .post('/api/tracking/location')
                .send(locationData);

            expectApiSuccess(response);
            expect(response.body.data).toHaveProperty('timestamp');
            expect(response.body.data).toHaveProperty('success', true);
        });

        it('should validate GPS coordinates', async () => {
            const vehicle = await seedTestVehicle(testDb!, testUserId);

            const invalidLocation = {
                vehicleId: vehicle.id,
                latitude: 999, // Invalid
                longitude: -74.006,
            };

            const response = await authenticatedRequest(app, testToken)
                .post('/api/tracking/location')
                .send(invalidLocation);

            expectApiError(response, 422);
        });

        it('GET /api/tracking/vehicle/:id/recent - should get recent locations', async () => {
            const vehicle = await seedTestVehicle(testDb!, testUserId);

            const response = await authenticatedRequest(app, testToken).get(
                `/api/tracking/vehicle/${vehicle.id}/recent`
            );

            expectApiSuccess(response);
            expect(response.body.data).toHaveProperty('locations');
            expect(response.body.data.locations).toBeInstanceOf(Array);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // Try to create a vehicle with duplicate license plate (if unique constraint exists)
            const vehicleData = {
                licensePlate: 'DUPLICATE-123',
                make: 'Toyota',
                model: 'Camry',
                year: 2023,
            };

            // Create first vehicle
            await authenticatedRequest(app, testToken).post('/api/vehicles').send(vehicleData);

            // Try to create duplicate
            const response = await authenticatedRequest(app, testToken)
                .post('/api/vehicles')
                .send(vehicleData);

            // Should handle the conflict appropriately
            expect([409, 422]).toContain(response.status);
        });

        it('should return proper error for malformed JSON', async () => {
            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${testToken}`)
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            expect(response.status).toBe(400);
        });
    });
});
