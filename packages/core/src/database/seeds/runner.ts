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
            .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
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
                    console.warn(
                        `Skipping ${file}: No default export or seed function found`
                    );
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

/**
 * Create a new seed file
 *
 * @param name - Seed name
 * @param seedsDir - Directory to create seed in
 * @returns Path to created seed file
 *
 * @example
 * ```typescript
 * const seedPath = await createSeedFile('seed_users', './seeds');
 * ```
 */
export async function createSeedFile(
    name: string,
    seedsDir: string
): Promise<string> {
    const fs = await import('fs');
    const { promises: fsp } = fs;
    const { resolve, join } = await import('path');

    try {
        console.log(`Creating seed: ${name}`);

        // Find the next number for the seed file
        const seedDir = resolve(seedsDir);
        let files: string[] = [];
        try {
            files = await fsp.readdir(seedDir);
        } catch (/* eslint-disable-line @typescript-eslint/no-unused-vars */ _) {
            // Directory doesn't exist, will be created
            await fsp.mkdir(seedDir, { recursive: true });
        }

        const existingSeeds = files
            .filter(file => /^\d{3}_.*\.ts$/.test(file))
            .sort();

        let nextNumber = 1;
        if (existingSeeds.length > 0) {
            const lastSeed = existingSeeds[existingSeeds.length - 1];
            if (lastSeed) {
                const match = lastSeed.match(/^(\d{3})_/);
                if (match && match[1]) {
                    nextNumber = parseInt(match[1], 10) + 1;
                }
            }
        }

        const paddedNumber = nextNumber.toString().padStart(3, '0');
        const fileName = `${paddedNumber}_${name}.ts`;
        const seedPath = join(seedDir, fileName);

        // Create the seed file with template content
        const template = `import { Pool } from 'pg';

/**
 * Seed: ${name}
 * 
 * Add your seed data here
 */
export default async (pool: Pool) => {
    // Example:
    // await pool.query(\`
    //     INSERT INTO table_name (column1, column2) VALUES
    //     ('value1', 'value2'),
    //     ('value3', 'value4')
    //     ON CONFLICT (unique_column) DO NOTHING
    // \`);
    
    console.log('Seed ${name} executed');
};
`;

        await fsp.writeFile(seedPath, template, 'utf8');

        console.log(`Seed created: ${seedPath}`);
        return seedPath;
    } catch (error) {
        console.error('Error creating seed:', error);
        throw error;
    }
}
