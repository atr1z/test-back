import { resolve } from 'path';
import { MigrationConfig } from '../types';

/**
 * Run database migrations using node-pg-migrate
 * 
 * @param config - Migration configuration
 * @returns Migration result
 * 
 * @example
 * ```typescript
 * await runMigrations({
 *   databaseUrl: process.env.DATABASE_URL,
 *   migrationsDir: './migrations',
 *   direction: 'up',
 * });
 * ```
 */
export async function runMigrations(config: MigrationConfig): Promise<void> {
  // Import node-pg-migrate dynamically
  const migrate = (await import('node-pg-migrate')).default;

  const {
    databaseUrl,
    migrationsDir,
    migrationsTable = 'pgmigrations',
    schema = 'public',
    direction = 'up',
    count,
  } = config;

  try {
    console.log(`Running migrations ${direction}...`);
    console.log(`Migrations directory: ${migrationsDir}`);
    
    await migrate({
      databaseUrl,
      dir: resolve(migrationsDir),
      direction,
      count,
      migrationsTable,
      schema,
      verbose: true,
      checkOrder: true,
      createSchema: true,
      createMigrationsSchema: true,
      log: (msg) => {
        console.log('[Migration]:', msg);
      },
    });

    console.log(`Migrations ${direction} completed successfully!`);
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

/**
 * Create a new migration file
 * 
 * @param name - Migration name
 * @param migrationsDir - Directory to create migration in
 * @returns Path to created migration file
 * 
 * @example
 * ```typescript
 * const migrationPath = await createMigration('create_users_table', './migrations');
 * ```
 */
export async function createMigration(
  name: string,
  migrationsDir: string
): Promise<string> {
  const migrate = (await import('node-pg-migrate')).default;

  try {
    console.log(`Creating migration: ${name}`);
    
    await migrate({
      databaseUrl: 'placeholder', // Not needed for create
      dir: resolve(migrationsDir),
      direction: 'up',
      count: 0,
      createMigrationsSchema: false,
      noLock: true,
      ignorePattern: '.*',
      name,
    } as any);

    const migrationPath = `${resolve(migrationsDir)}/${Date.now()}_${name}.sql`;
    console.log(`Migration created: ${migrationPath}`);
    return migrationPath;
  } catch (error) {
    console.error('Error creating migration:', error);
    throw error;
  }
}

/**
 * Get migration status
 * 
 * @param config - Migration configuration
 * @returns List of migrations with their status
 */
export async function getMigrationStatus(config: MigrationConfig): Promise<any[]> {
  const { Pool } = await import('pg');
  const { databaseUrl, migrationsTable = 'pgmigrations', schema = 'public' } = config;
  
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    const result = await pool.query(
      `SELECT * FROM ${schema}.${migrationsTable} ORDER BY run_on DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching migration status:', error);
    return [];
  } finally {
    await pool.end();
  }
}

