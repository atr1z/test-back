import { Pool } from 'pg';
import { SeedFunction } from '@atriz/database';

/**
 * Seed data for Mextrack application
 */
const seed: SeedFunction = async (pool: Pool) => {
  console.log('Seeding Mextrack app data...');

  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping seed data in production environment');
    return;
  }

  try {
    // Add your Mextrack-specific seed data here
    
    console.log('Mextrack app seed completed!');
  } catch (error) {
    console.error('Error seeding Mextrack app data:', error);
    throw error;
  }
};

export default seed;

