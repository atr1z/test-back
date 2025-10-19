import { hash, verify } from '@node-rs/argon2';

/**
 * Hash options following OWASP recommendations
 */
const HASH_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, HASH_OPTIONS);
}

/**
 * Verify a password against a hash
 * @param hash - Hashed password
 * @param password - Plain text password to verify
 * @returns True if password matches
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await verify(hash, password, HASH_OPTIONS);
  } catch {
    return false;
  }
}
