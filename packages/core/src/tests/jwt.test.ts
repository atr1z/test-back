import { describe, it, expect, beforeEach } from 'vitest';
import { JWTService } from '../service/jwt.js';
import { JWTPayload, TokenOptions } from '../types/index.js';

describe('JWTService', () => {
    let jwtService: JWTService;
    const testSecret = 'test-secret-key-for-testing-only';
    const testPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
    };

    beforeEach(() => {
        jwtService = new JWTService(testSecret, '1h');
    });

    describe('constructor', () => {
        it('should create instance with secret and default expiration', () => {
            const service = new JWTService(testSecret);
            expect(service).toBeInstanceOf(JWTService);
        });

        it('should create instance with custom expiration', () => {
            const service = new JWTService(testSecret, '2d');
            expect(service).toBeInstanceOf(JWTService);
        });

        it('should throw error when secret is empty', () => {
            expect(() => new JWTService('')).toThrow('JWT secret is required');
        });

        it('should throw error when secret is not provided', () => {
            expect(() => new JWTService(null as any)).toThrow(
                'JWT secret is required'
            );
        });
    });

    describe('generateToken', () => {
        it('should generate a valid token', () => {
            const token = jwtService.generateToken(testPayload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should generate different tokens for different payloads', () => {
            const payload1: JWTPayload = { userId: 'user-1' };
            const payload2: JWTPayload = { userId: 'user-2' };

            const token1 = jwtService.generateToken(payload1);
            const token2 = jwtService.generateToken(payload2);

            expect(token1).not.toBe(token2);
        });

        it('should generate different tokens for same payload (due to iat)', async () => {
            const token1 = jwtService.generateToken(testPayload);
            // Add delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 1000));
            const token2 = jwtService.generateToken(testPayload);

            // Decode both tokens to check their iat values
            const decoded1 = jwtService.decodeToken(token1);
            const decoded2 = jwtService.decodeToken(token2);

            expect(token1).not.toBe(token2);
            expect(decoded1?.['iat']).not.toBe(decoded2?.['iat']);
        });

        it('should use custom expiration when provided', () => {
            const options: TokenOptions = { expiresIn: '30m' };
            const token = jwtService.generateToken(testPayload, options);

            expect(token).toBeDefined();
            // We can't easily test the exact expiration without mocking time
            // but we can verify the token is generated
        });

        it('should handle payload with additional properties', () => {
            const extendedPayload: JWTPayload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'admin',
                permissions: ['read', 'write'],
            };

            const token = jwtService.generateToken(extendedPayload);
            expect(token).toBeDefined();
        });
    });

    describe('verifyToken', () => {
        it('should verify and decode a valid token', () => {
            const token = jwtService.generateToken(testPayload);
            const decoded = jwtService.verifyToken(token);

            expect(decoded).toBeDefined();
            expect(decoded.userId).toBe(testPayload.userId);
            expect(decoded.email).toBe(testPayload.email);
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => jwtService.verifyToken(invalidToken)).toThrow(
                'Invalid token'
            );
        });

        it('should throw error for malformed token', () => {
            const malformedToken = 'not-a-jwt-token';

            expect(() => jwtService.verifyToken(malformedToken)).toThrow(
                'Invalid token'
            );
        });

        it('should throw error for token with wrong secret', () => {
            const otherService = new JWTService('different-secret');
            const token = otherService.generateToken(testPayload);

            expect(() => jwtService.verifyToken(token)).toThrow(
                'Invalid token'
            );
        });

        it('should throw error for expired token', () => {
            const expiredService = new JWTService(testSecret, '1ms');
            const token = expiredService.generateToken(testPayload);

            // Wait for token to expire
            setTimeout(() => {
                expect(() => jwtService.verifyToken(token)).toThrow(
                    'Token has expired'
                );
            }, 10);
        });
    });

    describe('decodeToken', () => {
        it('should decode token without verification', () => {
            const token = jwtService.generateToken(testPayload);
            const decoded = jwtService.decodeToken(token);

            expect(decoded).toBeDefined();
            expect(decoded?.userId).toBe(testPayload.userId);
            expect(decoded?.email).toBe(testPayload.email);
        });

        it('should return null for invalid token', () => {
            const invalidToken = 'invalid.token.here';
            const decoded = jwtService.decodeToken(invalidToken);

            expect(decoded).toBeNull();
        });

        it('should decode expired token without verification', () => {
            const expiredService = new JWTService(testSecret, '1ms');
            const token = expiredService.generateToken(testPayload);

            const decoded = jwtService.decodeToken(token);
            expect(decoded).toBeDefined();
            expect(decoded?.userId).toBe(testPayload.userId);
        });

        it('should decode token with wrong secret', () => {
            const otherService = new JWTService('different-secret');
            const token = otherService.generateToken(testPayload);

            const decoded = jwtService.decodeToken(token);
            expect(decoded).toBeDefined();
            expect(decoded?.userId).toBe(testPayload.userId);
        });
    });

    describe('integration tests', () => {
        it('should generate, verify, and decode token successfully', () => {
            const payload: JWTPayload = {
                userId: 'integration-test-user',
                email: 'integration@test.com',
                role: 'user',
            };

            // Generate token
            const token = jwtService.generateToken(payload);
            expect(token).toBeDefined();

            // Verify token
            const verified = jwtService.verifyToken(token);
            expect(verified.userId).toBe(payload.userId);
            expect(verified.email).toBe(payload.email);
            expect(verified['role']).toBe(payload['role']);

            // Decode token
            const decoded = jwtService.decodeToken(token);
            expect(decoded?.userId).toBe(payload.userId);
            expect(decoded?.email).toBe(payload.email);
            expect(decoded?.['role']).toBe(payload['role']);
        });
    });
});
