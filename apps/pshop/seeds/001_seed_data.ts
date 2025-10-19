import { Pool } from 'pg';
import { SeedFunction } from '@atriz/database';

/**
 * Seed data for PShop application
 */
const seed: SeedFunction = async (pool: Pool) => {
  console.log('Seeding PShop app data...');

  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping seed data in production environment');
    return;
  }

  try {
    // Add your PShop-specific seed data here
    
    console.log('PShop app seed completed!');
  } catch (error) {
    console.error('Error seeding PShop app data:', error);
    throw error;
  }
};

export default seed;

