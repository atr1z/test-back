/**
 * @atriz/database - Database utilities and connection management
 * 
 * Provides:
 * - Database connection pooling
 * - Migration utilities
 * - Seed utilities
 * - Transaction support
 */

// Connection management
export {
  createDatabasePool,
  withTransaction,
  testConnection,
} from './connection';

// Migration utilities
export {
  runMigrations,
  createMigration,
  getMigrationStatus,
} from './utils/migrationRunner';

// Seed utilities
export {
  runSeeds,
  createSeed,
  type SeedFunction,
} from './utils/seed';

// Types
export type {
  DatabaseConfig,
  DatabasePool,
  MigrationConfig,
  SeedConfig,
  QueryParams,
  TransactionCallback,
} from './types';

