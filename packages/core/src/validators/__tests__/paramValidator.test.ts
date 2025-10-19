import { describe, it, expect } from 'vitest';
import { ParamValidator } from '../paramValidator';
import { ParamDefinition } from '../../types/validation';

describe('ParamValidator', () => {
    describe('validateParam', () => {
        it('should validate required string parameter', async () => {
            const definition: ParamDefinition = {
                name: 'username',
                type: 'string',
                required: true,
            };

            const result = await ParamValidator.validateParam('username', 'john', definition);
            expect(result.valid).toBe(true);
        });

        it('should fail when required parameter is missing', async () => {
            const definition: ParamDefinition = {
                name: 'username',
                type: 'string',
                required: true,
            };

            const result = await ParamValidator.validateParam('username', undefined, definition);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('required');
        });

        it('should validate email parameter', async () => {
            const definition: ParamDefinition = {
                name: 'email',
                type: 'email',
                required: true,
            };

            const validResult = await ParamValidator.validateParam(
                'email',
                'test@example.com',
                definition
            );
            expect(validResult.valid).toBe(true);

            const invalidResult = await ParamValidator.validateParam(
                'email',
                'invalid-email',
                definition
            );
            expect(invalidResult.valid).toBe(false);
        });

        it('should validate string length', async () => {
            const definition: ParamDefinition = {
                name: 'username',
                type: 'string',
                required: true,
                min: 3,
                max: 10,
            };

            const tooShort = await ParamValidator.validateParam('username', 'ab', definition);
            expect(tooShort.valid).toBe(false);

            const tooLong = await ParamValidator.validateParam(
                'username',
                'verylongusername',
                definition
            );
            expect(tooLong.valid).toBe(false);

            const justRight = await ParamValidator.validateParam('username', 'john', definition);
            expect(justRight.valid).toBe(true);
        });

        it('should validate number range', async () => {
            const definition: ParamDefinition = {
                name: 'age',
                type: 'number',
                required: true,
                min: 18,
                max: 100,
            };

            const tooYoung = await ParamValidator.validateParam('age', 15, definition);
            expect(tooYoung.valid).toBe(false);

            const tooOld = await ParamValidator.validateParam('age', 150, definition);
            expect(tooOld.valid).toBe(false);

            const justRight = await ParamValidator.validateParam('age', 25, definition);
            expect(justRight.valid).toBe(true);
        });

        it('should validate with custom regex pattern', async () => {
            const definition: ParamDefinition = {
                name: 'code',
                type: 'string',
                required: true,
                pattern: /^[A-Z]{3}-\d{3}$/,
            };

            const valid = await ParamValidator.validateParam('code', 'ABC-123', definition);
            expect(valid.valid).toBe(true);

            const invalid = await ParamValidator.validateParam('code', 'invalid', definition);
            expect(invalid.valid).toBe(false);
        });

        it('should validate with custom function', async () => {
            const definition: ParamDefinition = {
                name: 'username',
                type: 'string',
                required: true,
                custom: async (value: string) => {
                    // Simulate async check (e.g., database lookup)
                    return value !== 'taken';
                },
                errorMessage: 'Username is already taken',
            };

            const available = await ParamValidator.validateParam('username', 'john', definition);
            expect(available.valid).toBe(true);

            const taken = await ParamValidator.validateParam('username', 'taken', definition);
            expect(taken.valid).toBe(false);
            expect(taken.message).toBe('Username is already taken');
        });

        it('should detect SQL injection attempts', async () => {
            const definition: ParamDefinition = {
                name: 'query',
                type: 'string',
                required: true,
            };

            const malicious = await ParamValidator.validateParam(
                'query',
                "'; DROP TABLE users; --",
                definition
            );
            expect(malicious.valid).toBe(false);
            expect(malicious.message).toBe('Invalid input detected');
        });

        it('should allow optional parameters to be undefined', async () => {
            const definition: ParamDefinition = {
                name: 'optional',
                type: 'string',
                required: false,
            };

            const result = await ParamValidator.validateParam('optional', undefined, definition);
            expect(result.valid).toBe(true);
        });
    });

    describe('validateParams', () => {
        it('should validate multiple parameters', async () => {
            const definitions: ParamDefinition[] = [
                { name: 'email', type: 'email', required: true },
                { name: 'age', type: 'number', required: true, min: 18 },
                { name: 'name', type: 'string', required: true, min: 2 },
            ];

            const params = {
                email: 'test@example.com',
                age: 25,
                name: 'John',
            };

            const results = await ParamValidator.validateParams(params, definitions);
            expect(results).toHaveLength(0); // No errors
        });

        it('should return all validation errors', async () => {
            const definitions: ParamDefinition[] = [
                { name: 'email', type: 'email', required: true },
                { name: 'age', type: 'number', required: true, min: 18 },
            ];

            const params = {
                email: 'invalid-email',
                age: 15,
            };

            const results = await ParamValidator.validateParams(params, definitions);
            expect(results).toHaveLength(2);
            expect(results.some((r) => r.field === 'email')).toBe(true);
            expect(results.some((r) => r.field === 'age')).toBe(true);
        });
    });
});
