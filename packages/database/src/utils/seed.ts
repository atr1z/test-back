import { resolve, join } from 'path';
import { readdirSync } from 'fs';
import { Pool } from 'pg';
import { SeedConfig } from '../types';

/**
 * Run database seed files
 * 
 * @param config - Seed configuration
 * @returns Number of seed files executed
 * 
 * @example
 * ```typescript
 * await runSeeds({
 *   databaseUrl: process.env.DATABASE_URL,
 *   seedsDir: './seeds',
 * });
 * ```
 */
export async function runSeeds(config: SeedConfig): Promise<number> {
    const { databaseUrl, seedsDir } = config;

    const pool = new Pool({ connectionString: databaseUrl });

    try {
        const seedDir = resolve(seedsDir);
        console.log(`Running seeds from: ${seedDir}`);

        // Get all .ts and .js files from seeds directory
        const seedFiles = readdirSync(seedDir)
            .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
            .sort(); // Execute in alphabetical order

        if (seedFiles.length === 0) {
            console.log('No seed files found');
            return 0;
        }

        console.log(`Found ${seedFiles.length} seed file(s)`);

        for (const file of seedFiles) {
            const seedPath = join(seedDir, file);
            console.log(`Running seed: ${file}`);

            try {
                // Import and execute seed file
                const seedModule = await import(seedPath);
                const seedFunction = seedModule.default || seedModule.seed;

                if (typeof seedFunction !== 'function') {
                    console.warn(`Skipping ${file}: No default export or seed function found`);
                    continue;
                }

                await seedFunction(pool);
                console.log(`✓ Completed: ${file}`);
            } catch (error) {
                console.error(`✗ Failed: ${file}`, error);
                throw error;
            }
        }

        console.log(`All seeds completed successfully!`);
        return seedFiles.length;
    } catch (error) {
        console.error('Seed error:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

/**
 * Seed function type
 */
export type SeedFunction = (pool: Pool) => Promise<void>;

/**
 * Helper to create a seed file
 * 
 * @example
 * ```typescript
 * // In your seed file (e.g., 001_seed_users.ts)
 * import { SeedFunction } from '@atriz/database';
 * 
 * const seed: SeedFunction = async (pool) => {
 *   await pool.query(`
 *     INSERT INTO users (email, password_hash, name)
 *     VALUES ($1, $2, $3)
 *   `, ['admin@example.com', 'hash', 'Admin']);
 * };
 * 
 * export default seed;
 * ```
 */
export function createSeed(seedFn: SeedFunction): SeedFunction {
    return seedFn;
}

