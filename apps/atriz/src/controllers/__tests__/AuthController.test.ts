import { describe, it, expect, beforeEach } from 'vitest';
import { ControllerTestHelper, createMockService, HttpStatus } from '@atriz/core';
import { JWTService, PasswordService } from '@atriz/auth';
import { RegisterController, LoginController } from '../AuthController';

describe('AuthController', () => {
    describe('RegisterController', () => {
        let mockJWTService: JWTService & { _calls: Map<string, any[][]> };
        let mockPasswordService: PasswordService & { _calls: Map<string, any[][]> };
        let services: any;

        beforeEach(() => {
            mockJWTService = createMockService<JWTService>({
                generateToken: (payload) => 'mock-jwt-token',
            });

            mockPasswordService = createMockService<PasswordService>({
                hashPassword: async (password) => `hashed_${password}`,
            });

            services = {
                jwtService: mockJWTService,
                passwordService: mockPasswordService,
            };
        });

        it('should register a user successfully', async () => {
            const result = await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'Password123!',
                        name: 'Test User',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.Created);
            expect(result.body.success).toBe(true);
            expect(result.body.data.user.email).toBe('test@example.com');
            expect(result.body.data.user.name).toBe('Test User');
            expect(result.body.data.token).toBe('mock-jwt-token');
            expect(result.body.message).toBe('User registered successfully');
        });

        it('should fail when email is missing', async () => {
            const result = await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        password: 'Password123!',
                        name: 'Test User',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
            expect(result.body.message).toBe('Validation failed');
            expect(result.body.errors).toContain("Parameter 'email' is required");
        });

        it('should fail when email is invalid', async () => {
            const result = await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        email: 'invalid-email',
                        password: 'Password123!',
                        name: 'Test User',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
            expect(result.body.errors).toContain('email must be a valid email');
        });

        it('should fail when password is weak', async () => {
            const result = await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'weak',
                        name: 'Test User',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
            expect(result.body.errors?.[0]).toContain('password');
        });

        it('should fail when name is too short', async () => {
            const result = await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'Password123!',
                        name: 'A',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
        });

        it('should call passwordService.hashPassword', async () => {
            await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'Password123!',
                        name: 'Test User',
                    },
                },
                services
            );

            const calls = mockPasswordService._calls.get('hashPassword');
            expect(calls).toBeDefined();
            expect(calls?.length).toBe(1);
            expect(calls?.[0][0]).toBe('Password123!');
        });

        it('should call jwtService.generateToken with correct payload', async () => {
            await ControllerTestHelper.execute(
                RegisterController,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'Password123!',
                        name: 'Test User',
                    },
                },
                services
            );

            const calls = mockJWTService._calls.get('generateToken');
            expect(calls).toBeDefined();
            expect(calls?.length).toBe(1);
            expect(calls?.[0][0].email).toBe('test@example.com');
        });
    });

    describe('LoginController', () => {
        let mockJWTService: JWTService & { _calls: Map<string, any[][]> };
        let mockPasswordService: PasswordService & { _calls: Map<string, any[][]> };
        let services: any;

        beforeEach(() => {
            mockJWTService = createMockService<JWTService>({
                generateToken: (payload) => 'mock-jwt-token',
            });

            mockPasswordService = createMockService<PasswordService>({
                hashPassword: async (password) => `hashed_${password}`,
                comparePassword: async (password, hash) => password === 'password123',
            });

            services = {
                jwtService: mockJWTService,
                passwordService: mockPasswordService,
            };
        });

        it('should login successfully with correct credentials', async () => {
            const result = await ControllerTestHelper.execute(
                LoginController,
                {
                    body: {
                        email: 'demo@example.com',
                        password: 'password123',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.OK);
            expect(result.body.data.token).toBe('mock-jwt-token');
            expect(result.body.data.user.email).toBe('demo@example.com');
        });

        it('should fail with incorrect email', async () => {
            const result = await ControllerTestHelper.execute(
                LoginController,
                {
                    body: {
                        email: 'wrong@example.com',
                        password: 'password123',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.Unauthorized);
            expect(result.body.success).toBe(false);
            expect(result.body.message).toBe('Invalid credentials');
        });

        it('should fail with incorrect password', async () => {
            const result = await ControllerTestHelper.execute(
                LoginController,
                {
                    body: {
                        email: 'demo@example.com',
                        password: 'wrongpassword',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.Unauthorized);
            expect(result.body.success).toBe(false);
            expect(result.body.message).toBe('Invalid credentials');
        });

        it('should fail when email is missing', async () => {
            const result = await ControllerTestHelper.execute(
                LoginController,
                {
                    body: {
                        password: 'password123',
                    },
                },
                services
            );

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
        });
    });
});
