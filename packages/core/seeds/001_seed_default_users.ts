import { Pool } from 'pg';
import { SeedFunction } from '@atriz/database';
import * as bcrypt from 'bcryptjs';

/**
 * Seed default users for development/testing
 * 
 * Note: This should NOT be run in production!
 * Use environment-specific seed files for production data.
 */
const seed: SeedFunction = async (pool: Pool) => {
  console.log('Seeding default users...');

  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping default user seed in production environment');
    return;
  }

  // Password: "Test123!@#" (hashed with bcrypt)
  // Generate hash for development - in production, users should set their own passwords
  const testPasswordHash = await bcrypt.hash('Test123!@#', 10);

  try {
    // Get admin role
    const roleResult = await pool.query(
      `SELECT id FROM roles WHERE name = $1`,
      ['admin']
    );

    const adminRoleId = roleResult.rows[0]?.id;

    // Insert test admin user
    const userResult = await pool.query(
      `
      INSERT INTO users (email, password_hash, name, email_verified, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
      `,
      ['admin@atriz.dev', testPasswordHash, 'Admin User', true, true]
    );

    if (userResult.rows.length > 0 && adminRoleId) {
      const userId = userResult.rows[0].id;
      
      // Assign admin role
      await pool.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
        `,
        [userId, adminRoleId]
      );

      console.log('✓ Created admin user: admin@atriz.dev');
    }

    // Get user role
    const userRoleResult = await pool.query(
      `SELECT id FROM roles WHERE name = $1`,
      ['user']
    );

    const userRoleId = userRoleResult.rows[0]?.id;

    // Insert test regular user
    const regularUserResult = await pool.query(
      `
      INSERT INTO users (email, password_hash, name, email_verified, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
      `,
      ['user@atriz.dev', testPasswordHash, 'Test User', true, true]
    );

    if (regularUserResult.rows.length > 0 && userRoleId) {
      const userId = regularUserResult.rows[0].id;
      
      // Assign user role
      await pool.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
        `,
        [userId, userRoleId]
      );

      console.log('✓ Created test user: user@atriz.dev');
    }

    console.log('Default users seeded successfully!');
    console.log('');
    console.log('Test Credentials:');
    console.log('  Admin: admin@atriz.dev / Test123!@#');
    console.log('  User:  user@atriz.dev  / Test123!@#');
    console.log('');
    console.log('⚠️  Remember to change these passwords in production!');
  } catch (error) {
    console.error('Error seeding default users:', error);
    throw error;
  }
};

export default seed;

