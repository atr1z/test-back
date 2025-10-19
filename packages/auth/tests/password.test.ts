import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/password';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'test123456';
    const hashed = await hashPassword(password);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(50);
  });

  it('should verify correct password', async () => {
    const password = 'test123456';
    const hashed = await hashPassword(password);

    const isValid = await verifyPassword(hashed, password);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'test123456';
    const hashed = await hashPassword(password);

    const isValid = await verifyPassword(hashed, 'wrongpassword');
    expect(isValid).toBe(false);
  });

  it('should handle invalid hash gracefully', async () => {
    const isValid = await verifyPassword('invalid-hash', 'password');
    expect(isValid).toBe(false);
  });
});
