import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadEnv, getEnv, getEnvAsNumber, getEnvAsBoolean } from './env';

describe('env utilities', () => {
    beforeEach(() => {
        // Clear environment variables before each test
        vi.unstubAllEnvs();
    });

    describe('loadEnv', () => {
        it('should load environment variables from .env file', () => {
            // This test verifies that loadEnv doesn't throw
            expect(() => loadEnv()).not.toThrow();
        });
    });

    describe('getEnv', () => {
        it('should return environment variable value when it exists', () => {
            vi.stubEnv('TEST_VAR', 'test-value');
            expect(getEnv('TEST_VAR')).toBe('test-value');
        });

        it('should return default value when environment variable does not exist', () => {
            expect(getEnv('NON_EXISTENT_VAR', 'default-value')).toBe(
                'default-value'
            );
        });

        it('should throw error when environment variable does not exist and no default provided', () => {
            expect(() => getEnv('NON_EXISTENT_VAR')).toThrow(
                'Environment variable NON_EXISTENT_VAR is not set'
            );
        });

        it('should return empty string when environment variable is empty and no default provided', () => {
            vi.stubEnv('EMPTY_VAR', '');
            expect(getEnv('EMPTY_VAR')).toBe('');
        });
    });

    describe('getEnvAsNumber', () => {
        it('should return parsed number when environment variable is a valid number', () => {
            vi.stubEnv('NUMBER_VAR', '42');
            expect(getEnvAsNumber('NUMBER_VAR')).toBe(42);
        });

        it('should return default value when environment variable does not exist', () => {
            expect(getEnvAsNumber('NON_EXISTENT_VAR', 100)).toBe(100);
        });

        it('should throw error when environment variable is not a valid number', () => {
            vi.stubEnv('INVALID_NUMBER', 'not-a-number');
            expect(() => getEnvAsNumber('INVALID_NUMBER')).toThrow(
                'Environment variable INVALID_NUMBER is not a valid number'
            );
        });

        it('should throw error when environment variable does not exist and no default provided', () => {
            expect(() => getEnvAsNumber('NON_EXISTENT_VAR')).toThrow(
                'Environment variable NON_EXISTENT_VAR is not set'
            );
        });
    });

    describe('getEnvAsBoolean', () => {
        it('should return true for "true" string', () => {
            vi.stubEnv('BOOL_VAR', 'true');
            expect(getEnvAsBoolean('BOOL_VAR')).toBe(true);
        });

        it('should return true for "1" string', () => {
            vi.stubEnv('BOOL_VAR', '1');
            expect(getEnvAsBoolean('BOOL_VAR')).toBe(true);
        });

        it('should return false for "false" string', () => {
            vi.stubEnv('BOOL_VAR', 'false');
            expect(getEnvAsBoolean('BOOL_VAR')).toBe(false);
        });

        it('should return false for "0" string', () => {
            vi.stubEnv('BOOL_VAR', '0');
            expect(getEnvAsBoolean('BOOL_VAR')).toBe(false);
        });

        it('should return false for any other string', () => {
            vi.stubEnv('BOOL_VAR', 'maybe');
            expect(getEnvAsBoolean('BOOL_VAR')).toBe(false);
        });

        it('should return default value when environment variable does not exist', () => {
            expect(getEnvAsBoolean('NON_EXISTENT_VAR', true)).toBe(true);
        });

        it('should throw error when environment variable does not exist and no default provided', () => {
            expect(() => getEnvAsBoolean('NON_EXISTENT_VAR')).toThrow(
                'Environment variable NON_EXISTENT_VAR is not set'
            );
        });
    });
});
