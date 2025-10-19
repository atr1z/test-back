import { describe, it, expect, beforeEach } from 'vitest';
import { JWTService } from '../jwt';

describe('JWTService', () => {
    let jwtService: JWTService;
    const testSecret = 'test-secret-key-for-jwt';

    beforeEach(() => {
        jwtService = new JWTService(testSecret);
    });

    describe('constructor', () => {
        it('should throw error if secret is not provided', () => {
            expect(() => new JWTService('')).toThrow('JWT secret is required');
        });

        it('should use default expiration time', () => {
            const service = new JWTService(testSecret);
            expect(service).toBeDefined();
        });

        it('should accept custom expiration time', () => {
            const service = new JWTService(testSecret, '1h');
            expect(service).toBeDefined();
        });
    });

    describe('generateToken', () => {
        it('should generate a valid token', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
            };

            const token = jwtService.generateToken(payload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
        });

        it('should generate token with custom expiration', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
            };

            const token = jwtService.generateToken(payload, { expiresIn: '1h' });
            expect(token).toBeDefined();
        });
    });

    describe('verifyToken', () => {
        it('should verify and decode a valid token', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
            };

            const token = jwtService.generateToken(payload);
            const decoded = jwtService.verifyToken(token);

            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';
            expect(() => jwtService.verifyToken(invalidToken)).toThrow('Invalid token');
        });

        it('should throw error for expired token', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
            };

            // Create token that expires immediately
            const token = jwtService.generateToken(payload, { expiresIn: -1 });

            expect(() => jwtService.verifyToken(token)).toThrow('Token has expired');
        });

        it('should throw error for token with wrong secret', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
            };

            const token = jwtService.generateToken(payload);
            const differentService = new JWTService('different-secret');

            expect(() => differentService.verifyToken(token)).toThrow('Invalid token');
        });
    });

    describe('decodeToken', () => {
        it('should decode token without verification', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
            };

            const token = jwtService.generateToken(payload);
            const decoded = jwtService.decodeToken(token);

            expect(decoded).toBeDefined();
            expect(decoded?.userId).toBe(payload.userId);
            expect(decoded?.email).toBe(payload.email);
        });

        it('should return null for invalid token', () => {
            const invalidToken = 'not-a-valid-token';
            const decoded = jwtService.decodeToken(invalidToken);
            expect(decoded).toBeNull();
        });
    });
});
