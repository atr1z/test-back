#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from the built core package using relative path
const corePackagePath = path.join(
    __dirname,
    '../packages/core/dist/database/seeds/runner.js'
);
const { runSeeds, createSeedFile } = await import(corePackagePath);

// Database configurations
const DATABASES = {
    core: {
        url: process.env.CORE_DATABASE_URL || process.env.DATABASE_URL,
        dir: path.join(__dirname, '../packages/core/seeds/users'),
    },
    tracking: {
        url: process.env.TRACKING_DATABASE_URL,
        dir: path.join(__dirname, '../packages/core/seeds/tracking'),
    },
    atriz: {
        url: process.env.ATRIZ_DATABASE_URL,
        dir: path.join(__dirname, '../apps/atriz/seeds'),
    },
    followsite: {
        url: process.env.FOLLOWSITE_DATABASE_URL,
        dir: path.join(__dirname, '../apps/followsite/seeds'),
    },
    pshop: {
        url: process.env.PSHOP_DATABASE_URL,
        dir: path.join(__dirname, '../apps/pshop/seeds'),
    },
};

async function main() {
    const command = process.argv[2];
    const database = process.argv[3];
    const seedName = process.argv[4];

    if (!command) {
        console.log(
            'Usage: node scripts/seed.mjs <command> [database] [seed-name]'
        );
        console.log('');
        console.log('Commands:');
        console.log('  run       Run seeds');
        console.log('  create    Create a new seed file');
        console.log('');
        console.log('Databases:');
        console.log('  core      Core database (auth, users)');
        console.log('  tracking  Tracking database (TimescaleDB)');
        console.log('  atriz     Atriz application database');
        console.log('  followsite Followsite database');
        console.log('  pshop     PShop database');
        console.log('  all       All databases (run only)');
        process.exit(1);
    }

    try {
        if (command === 'create') {
            if (!database || !seedName) {
                console.error(
                    'Error: Database and seed name are required for create command'
                );
                console.log(
                    'Usage: node scripts/seed.mjs create <database> <seed-name>'
                );
                process.exit(1);
            }

            const dbConfig = DATABASES[database];
            if (!dbConfig) {
                console.error(`Error: Unknown database '${database}'`);
                process.exit(1);
            }

            // Ensure seeds directory exists
            if (!fs.existsSync(dbConfig.dir)) {
                fs.mkdirSync(dbConfig.dir, { recursive: true });
            }

            await createSeedFile(seedName, dbConfig.dir);
            console.log(`✓ Seed created: ${seedName}`);
        } else if (command === 'run') {
            if (database === 'all') {
                for (const [dbName, dbConfig] of Object.entries(DATABASES)) {
                    if (dbConfig.url) {
                        console.log(
                            `\n--- Seeding ${dbName.toUpperCase()} ---`
                        );

                        // Ensure seeds directory exists
                        if (!fs.existsSync(dbConfig.dir)) {
                            console.log(
                                `No seeds directory found for ${dbName}, skipping...`
                            );
                            continue;
                        }

                        const count = await runSeeds({
                            databaseUrl: dbConfig.url,
                            seedsDir: dbConfig.dir,
                        });
                        console.log(`✓ Seeded ${count} files for ${dbName}`);
                    }
                }
            } else {
                const dbConfig = DATABASES[database];
                if (!dbConfig || !dbConfig.url) {
                    console.error(
                        `Error: Database '${database}' not configured`
                    );
                    process.exit(1);
                }

                // Ensure seeds directory exists
                if (!fs.existsSync(dbConfig.dir)) {
                    console.log(`Creating seeds directory: ${dbConfig.dir}`);
                    fs.mkdirSync(dbConfig.dir, { recursive: true });
                }

                const count = await runSeeds({
                    databaseUrl: dbConfig.url,
                    seedsDir: dbConfig.dir,
                });
                console.log(`✓ Seeded ${count} files for ${database}`);
            }
        } else {
            console.error(`Error: Unknown command '${command}'`);
            process.exit(1);
        }
    } catch (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
