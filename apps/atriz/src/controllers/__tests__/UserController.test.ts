import { describe, it, expect } from 'vitest';
import { ControllerTestHelper, HttpStatus } from '@atriz/core';
import { GetUserProfileController, UpdateUserProfileController } from '../UserController';

describe('UserController', () => {
    describe('GetUserProfileController', () => {
        it('should return user profile when authenticated', async () => {
            const result = await ControllerTestHelper.execute(GetUserProfileController, {
                user: {
                    userId: '123',
                    email: 'user@example.com',
                },
            });

            expect(result.statusCode).toBe(HttpStatus.OK);
            expect(result.body.success).toBe(true);
            expect(result.body.data.user.id).toBe('123');
            expect(result.body.data.user.email).toBe('user@example.com');
        });

        it('should fail when not authenticated', async () => {
            const result = await ControllerTestHelper.execute(GetUserProfileController, {
                // No user provided
            });

            expect(result.statusCode).toBe(HttpStatus.Unauthorized);
            expect(result.body.success).toBe(false);
            expect(result.body.message).toBe('Authentication required');
        });
    });

    describe('UpdateUserProfileController', () => {
        it('should update user profile successfully', async () => {
            const result = await ControllerTestHelper.execute(UpdateUserProfileController, {
                user: {
                    userId: '123',
                    email: 'user@example.com',
                },
                body: {
                    name: 'Updated Name',
                    phone: '1234567890',
                    bio: 'Updated bio',
                },
            });

            expect(result.statusCode).toBe(HttpStatus.OK);
            expect(result.body.success).toBe(true);
            expect(result.body.data.user.name).toBe('Updated Name');
            expect(result.body.data.user.phone).toBe('1234567890');
            expect(result.body.data.user.bio).toBe('Updated bio');
        });

        it('should validate phone number format', async () => {
            const result = await ControllerTestHelper.execute(UpdateUserProfileController, {
                user: {
                    userId: '123',
                    email: 'user@example.com',
                },
                body: {
                    phone: 'invalid-phone',
                },
            });

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
            expect(result.body.errors?.[0]).toContain('phone');
        });

        it('should validate name length', async () => {
            const result = await ControllerTestHelper.execute(UpdateUserProfileController, {
                user: {
                    userId: '123',
                    email: 'user@example.com',
                },
                body: {
                    name: 'A', // Too short
                },
            });

            expect(result.statusCode).toBe(HttpStatus.UnprocessableEntity);
            expect(result.body.success).toBe(false);
        });

        it('should allow partial updates', async () => {
            const result = await ControllerTestHelper.execute(UpdateUserProfileController, {
                user: {
                    userId: '123',
                    email: 'user@example.com',
                },
                body: {
                    name: 'Only Name Updated',
                },
            });

            expect(result.statusCode).toBe(HttpStatus.OK);
            expect(result.body.data.user.name).toBe('Only Name Updated');
        });

        it('should fail when not authenticated', async () => {
            const result = await ControllerTestHelper.execute(UpdateUserProfileController, {
                body: {
                    name: 'Updated Name',
                },
            });

            expect(result.statusCode).toBe(HttpStatus.Unauthorized);
        });
    });
});
