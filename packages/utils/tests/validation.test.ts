import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, sanitizeString } from '../src/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      expect(validatePassword('test123456')).toBe(true);
      expect(validatePassword('MySecureP@ssw0rd')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('1234567')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should handle normal text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
    });
  });
});
