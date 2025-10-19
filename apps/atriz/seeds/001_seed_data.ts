import { Pool } from 'pg';
import { SeedFunction } from '@atriz/database';

/**
 * Seed data for Atriz application
 * 
 * This is a placeholder seed file for the Atriz app.
 * Add your application-specific seed data here.
 */
const seed: SeedFunction = async (pool: Pool) => {
  console.log('Seeding Atriz app data...');

  // Skip in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping seed data in production environment');
    return;
  }

  try {
    // Example: Seed some user profiles
    // Note: This assumes users already exist in the shared database
    
    console.log('Atriz app seed completed!');
  } catch (error) {
    console.error('Error seeding Atriz app data:', error);
    throw error;
  }
};

export default seed;

