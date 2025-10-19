import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from '../password';

describe('PasswordService', () => {
    let passwordService: PasswordService;

    beforeEach(() => {
        passwordService = new PasswordService();
    });

    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'MySecurePassword123!';
            const hash = await passwordService.hashPassword(password);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should generate different hashes for the same password', async () => {
            const password = 'MySecurePassword123!';
            const hash1 = await passwordService.hashPassword(password);
            const hash2 = await passwordService.hashPassword(password);

            // Hashes should be different due to salt
            expect(hash1).not.toBe(hash2);
        });

        it('should hash empty string', async () => {
            const hash = await passwordService.hashPassword('');
            expect(hash).toBeDefined();
            expect(hash.length).toBeGreaterThan(0);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password and hash', async () => {
            const password = 'MySecurePassword123!';
            const hash = await passwordService.hashPassword(password);
            const isMatch = await passwordService.comparePassword(password, hash);

            expect(isMatch).toBe(true);
        });

        it('should return false for non-matching password and hash', async () => {
            const password = 'MySecurePassword123!';
            const wrongPassword = 'WrongPassword456!';
            const hash = await passwordService.hashPassword(password);
            const isMatch = await passwordService.comparePassword(wrongPassword, hash);

            expect(isMatch).toBe(false);
        });

        it('should return false for empty password against valid hash', async () => {
            const password = 'MySecurePassword123!';
            const hash = await passwordService.hashPassword(password);
            const isMatch = await passwordService.comparePassword('', hash);

            expect(isMatch).toBe(false);
        });

        it('should handle case sensitivity', async () => {
            const password = 'MySecurePassword123!';
            const hash = await passwordService.hashPassword(password);
            const isMatch = await passwordService.comparePassword('mysecurepassword123!', hash);

            expect(isMatch).toBe(false);
        });
    });

    describe('custom salt rounds', () => {
        it('should accept custom salt rounds', async () => {
            const customService = new PasswordService(8);
            const password = 'TestPassword123!';
            const hash = await customService.hashPassword(password);

            expect(hash).toBeDefined();
            const isMatch = await customService.comparePassword(password, hash);
            expect(isMatch).toBe(true);
        });
    });
});

