import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from '../service/password';

describe('PasswordService', () => {
    let passwordService: PasswordService;

    beforeEach(() => {
        passwordService = new PasswordService(10);
    });

    describe('constructor', () => {
        it('should create instance with default salt rounds', () => {
            const service = new PasswordService();
            expect(service).toBeInstanceOf(PasswordService);
        });

        it('should create instance with custom salt rounds', () => {
            const service = new PasswordService(12);
            expect(service).toBeInstanceOf(PasswordService);
        });
    });

    describe('hashPassword', () => {
        it('should hash a password successfully', async () => {
            const password = 'test-password-123';
            const hash = await passwordService.hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should produce different hashes for the same password', async () => {
            const password = 'test-password-123';
            const hash1 = await passwordService.hashPassword(password);
            const hash2 = await passwordService.hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty password', async () => {
            const password = '';
            const hash = await passwordService.hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
        });

        it('should handle special characters in password', async () => {
            const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const hash = await passwordService.hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password and hash', async () => {
            const password = 'test-password-123';
            const hash = await passwordService.hashPassword(password);

            const result = await passwordService.comparePassword(
                password,
                hash
            );
            expect(result).toBe(true);
        });

        it('should return false for non-matching password and hash', async () => {
            const password = 'test-password-123';
            const wrongPassword = 'wrong-password';
            const hash = await passwordService.hashPassword(password);

            const result = await passwordService.comparePassword(
                wrongPassword,
                hash
            );
            expect(result).toBe(false);
        });

        it('should return false for empty password with valid hash', async () => {
            const password = 'test-password-123';
            const emptyPassword = '';
            const hash = await passwordService.hashPassword(password);

            const result = await passwordService.comparePassword(
                emptyPassword,
                hash
            );
            expect(result).toBe(false);
        });

        it('should handle special characters correctly', async () => {
            const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const hash = await passwordService.hashPassword(password);

            const result = await passwordService.comparePassword(
                password,
                hash
            );
            expect(result).toBe(true);
        });

        it('should work with different salt rounds', async () => {
            const password = 'test-password-123';
            const service1 = new PasswordService(8);
            const service2 = new PasswordService(12);

            const hash1 = await service1.hashPassword(password);
            const hash2 = await service2.hashPassword(password);

            // Both hashes should verify with their respective services
            expect(await service1.comparePassword(password, hash1)).toBe(true);
            expect(await service2.comparePassword(password, hash2)).toBe(true);

            // But cross-verification should work too (bcrypt handles this)
            expect(await service1.comparePassword(password, hash2)).toBe(true);
            expect(await service2.comparePassword(password, hash1)).toBe(true);
        });
    });
});
