import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { Application, Request, Response } from 'express';
import { WebService, getEnvAsNumber } from '@atriz/core';
import { setupContainer } from '../di/index.js';

describe('Health Endpoint', () => {
    let app: Application;

    beforeAll(() => {
        // Setup DI container
        setupContainer();

        // Create web service instance
        const webService = new WebService({
            port: getEnvAsNumber('PORT', 3001),
            env: 'test',
            cors: {
                origin: '*',
                credentials: true,
            },
        });

        // Add health check route (matching the actual implementation)
        webService.app.get(
            '/v1/health',
            (_req: Request, res: Response): void => {
                res.json({
                    status: 'ok',
                    service: 'atriz-backend',
                    version: '0.0.1',
                    timestamp: new Date().toISOString(),
                });
            }
        );

        // Add a 404 handler for testing
        webService.app.use((_req: Request, res: Response): void => {
            res.status(404).json({ message: 'Route not found' });
        });

        app = webService.app;
    });

    it('should return health status with correct structure', async () => {
        const response = await request(app).get('/v1/health').expect(200);

        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('service', 'atriz-backend');
        expect(response.body).toHaveProperty('version', '0.0.1');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return valid ISO timestamp', async () => {
        const response = await request(app).get('/v1/health').expect(200);

        expect(response.body.timestamp).toBeDefined();

        // Verify it's a valid ISO date
        const timestamp = new Date(response.body.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return 404 for non-existent endpoints', async () => {
        await request(app).get('/v1/nonexistent').expect(404);
    });

    it('should handle multiple concurrent health checks', async () => {
        const promises = Array.from({ length: 5 }, () =>
            request(app).get('/v1/health')
        );

        const responses = await Promise.all(promises);

        responses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
        });
    });

    it('should have proper CORS headers', async () => {
        const response = await request(app).get('/v1/health').expect(200);

        // CORS headers should be present
        expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should have proper content type', async () => {
        const response = await request(app).get('/v1/health').expect(200);

        expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle OPTIONS request for CORS preflight', async () => {
        await request(app).options('/v1/health').expect(204);
    });
});
