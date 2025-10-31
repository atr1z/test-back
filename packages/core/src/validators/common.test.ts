import { describe, it, expect } from 'vitest';
import { CommonValidators } from './common.js';

describe('CommonValidators', () => {
    describe('isValidEmail', () => {
        it('should return true for valid emails', () => {
            expect(CommonValidators.isValidEmail('test@example.com')).toBe(
                true
            );
            expect(
                CommonValidators.isValidEmail('user.name@domain.co.uk')
            ).toBe(true);
            expect(CommonValidators.isValidEmail('test+tag@example.org')).toBe(
                true
            );
        });

        it('should return false for invalid emails', () => {
            expect(CommonValidators.isValidEmail('invalid-email')).toBe(false);
            expect(CommonValidators.isValidEmail('@example.com')).toBe(false);
            expect(CommonValidators.isValidEmail('test@')).toBe(false);
            expect(CommonValidators.isValidEmail('test@.com')).toBe(false);
            expect(CommonValidators.isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPassword', () => {
        it('should return true for valid passwords', () => {
            expect(CommonValidators.isValidPassword('Password123!')).toBe(true);
            expect(CommonValidators.isValidPassword('MyPass123@')).toBe(true);
            expect(CommonValidators.isValidPassword('SecureP@ss1')).toBe(true);
        });

        it('should return false for invalid passwords', () => {
            expect(CommonValidators.isValidPassword('password')).toBe(false); // no uppercase, number, special char
            expect(CommonValidators.isValidPassword('PASSWORD')).toBe(false); // no lowercase, number, special char
            expect(CommonValidators.isValidPassword('Password')).toBe(false); // no number, special char
            expect(CommonValidators.isValidPassword('Password123')).toBe(false); // no special char
            expect(CommonValidators.isValidPassword('Pass1!')).toBe(false); // too short
            expect(CommonValidators.isValidPassword('')).toBe(false); // empty
        });
    });

    describe('isValidPhone', () => {
        it('should return true for valid phone numbers', () => {
            expect(CommonValidators.isValidPhone('1234567890')).toBe(true);
            expect(CommonValidators.isValidPhone('5551234567')).toBe(true);
        });

        it('should return false for invalid phone numbers', () => {
            expect(CommonValidators.isValidPhone('123456789')).toBe(false); // too short
            expect(CommonValidators.isValidPhone('12345678901')).toBe(false); // too long
            expect(CommonValidators.isValidPhone('123-456-7890')).toBe(false); // has dashes
            expect(CommonValidators.isValidPhone('(555) 123-4567')).toBe(false); // has formatting
            expect(CommonValidators.isValidPhone('abc1234567')).toBe(false); // has letters
            expect(CommonValidators.isValidPhone('')).toBe(false); // empty
        });
    });

    describe('isValidDate', () => {
        it('should return true for valid dates', () => {
            expect(CommonValidators.isValidDate('2023-01-01')).toBe(true);
            expect(CommonValidators.isValidDate('2023-12-31')).toBe(true);
            expect(CommonValidators.isValidDate(new Date())).toBe(true);
            expect(CommonValidators.isValidDate('2023-02-29')).toBe(false); // invalid leap year
        });

        it('should return false for invalid dates', () => {
            expect(CommonValidators.isValidDate('invalid-date')).toBe(false);
            expect(CommonValidators.isValidDate('2023-13-01')).toBe(false); // invalid month
            expect(CommonValidators.isValidDate('2023-01-32')).toBe(false); // invalid day
            expect(CommonValidators.isValidDate('')).toBe(false); // empty
        });
    });

    describe('isValidUrl', () => {
        it('should return true for valid URLs', () => {
            expect(CommonValidators.isValidUrl('https://example.com')).toBe(
                true
            );
            expect(CommonValidators.isValidUrl('http://localhost:3000')).toBe(
                true
            );
            expect(
                CommonValidators.isValidUrl(
                    'https://subdomain.example.com/path'
                )
            ).toBe(true);
            expect(
                CommonValidators.isValidUrl('https://example.com?query=value')
            ).toBe(true);
        });

        it('should return false for invalid URLs', () => {
            expect(CommonValidators.isValidUrl('not-a-url')).toBe(false);
            expect(CommonValidators.isValidUrl('example.com')).toBe(false); // missing protocol
            expect(CommonValidators.isValidUrl('')).toBe(false); // empty
        });
    });

    describe('isValidUuid', () => {
        it('should return true for valid UUIDs', () => {
            expect(
                CommonValidators.isValidUuid(
                    '123e4567-e89b-12d3-a456-426614174000'
                )
            ).toBe(true);
            expect(
                CommonValidators.isValidUuid(
                    '550e8400-e29b-41d4-a716-446655440000'
                )
            ).toBe(true);
            expect(
                CommonValidators.isValidUuid(
                    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
                )
            ).toBe(true);
        });

        it('should return false for invalid UUIDs', () => {
            expect(CommonValidators.isValidUuid('not-a-uuid')).toBe(false);
            expect(
                CommonValidators.isValidUuid('123e4567-e89b-12d3-a456')
            ).toBe(false); // too short
            expect(
                CommonValidators.isValidUuid(
                    '123e4567-e89b-12d3-a456-426614174000-extra'
                )
            ).toBe(false); // too long
            expect(CommonValidators.isValidUuid('')).toBe(false); // empty
        });
    });

    describe('hasSqlInjection', () => {
        it('should return true for potential SQL injection', () => {
            expect(
                CommonValidators.hasSqlInjection("'; DROP TABLE users; --")
            ).toBe(true);
            expect(
                CommonValidators.hasSqlInjection('SELECT * FROM users')
            ).toBe(true);
            expect(
                CommonValidators.hasSqlInjection(
                    'UNION SELECT password FROM users'
                )
            ).toBe(true);
            expect(
                CommonValidators.hasSqlInjection('INSERT INTO users VALUES')
            ).toBe(true);
        });

        it('should return false for safe content', () => {
            expect(CommonValidators.hasSqlInjection('normal text')).toBe(false);
            expect(CommonValidators.hasSqlInjection('{"json": "data"}')).toBe(
                false
            ); // JSON
            expect(CommonValidators.hasSqlInjection('[1, 2, 3]')).toBe(false); // JSON array
            expect(CommonValidators.hasSqlInjection('A'.repeat(600))).toBe(
                false
            ); // long content
            expect(CommonValidators.hasSqlInjection('')).toBe(false); // empty
        });
    });

    describe('sanitizeString', () => {
        it('should remove potential XSS content', () => {
            expect(
                CommonValidators.sanitizeString('<script>alert("xss")</script>')
            ).toBe('scriptalert(xss)/script');
            expect(
                CommonValidators.sanitizeString('javascript:alert("xss")')
            ).toBe('alert(xss)');
            expect(
                CommonValidators.sanitizeString('onclick="alert(\'xss\')"')
            ).toBe('alert(xss)');
        });

        it('should preserve safe content', () => {
            expect(CommonValidators.sanitizeString('normal text')).toBe(
                'normal text'
            );
            expect(CommonValidators.sanitizeString('user@example.com')).toBe(
                'user@example.com'
            );
            expect(CommonValidators.sanitizeString('1234567890')).toBe(
                '1234567890'
            );
        });
    });

    describe('isValidLength', () => {
        it('should validate string length correctly', () => {
            expect(CommonValidators.isValidLength('test', 2, 10)).toBe(true);
            expect(CommonValidators.isValidLength('test', 4, 4)).toBe(true);
            expect(CommonValidators.isValidLength('test', 1, 3)).toBe(false); // too long
            expect(CommonValidators.isValidLength('test', 5, 10)).toBe(false); // too short
        });

        it('should handle undefined min/max', () => {
            expect(CommonValidators.isValidLength('test', undefined, 10)).toBe(
                true
            );
            expect(CommonValidators.isValidLength('test', 2)).toBe(true);
            expect(CommonValidators.isValidLength('test')).toBe(true);
        });
    });

    describe('isInRange', () => {
        it('should validate number range correctly', () => {
            expect(CommonValidators.isInRange(5, 1, 10)).toBe(true);
            expect(CommonValidators.isInRange(5, 5, 5)).toBe(true);
            expect(CommonValidators.isInRange(5, 1, 3)).toBe(false); // too high
            expect(CommonValidators.isInRange(5, 7, 10)).toBe(false); // too low
        });

        it('should handle undefined min/max', () => {
            expect(CommonValidators.isInRange(5, undefined, 10)).toBe(true);
            expect(CommonValidators.isInRange(5, 1)).toBe(true);
            expect(CommonValidators.isInRange(5)).toBe(true);
        });
    });
});
