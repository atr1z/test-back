#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from the built core package using relative path
const corePackagePath = path.join(
    __dirname,
    '../packages/core/dist/database/migrations/runner.js'
);
const { runMigrations, createMigration, getMigrationStatus } = await import(
    corePackagePath
);

// Database configurations
const DATABASES = {
    core: {
        url: process.env.CORE_DATABASE_URL || process.env.DATABASE_URL,
        dir: path.join(__dirname, '../packages/core/migrations/users'),
    },
    tracking: {
        url: process.env.TRACKING_DATABASE_URL,
        dir: path.join(__dirname, '../packages/core/migrations/tracking'),
    },
    atriz: {
        url: process.env.ATRIZ_DATABASE_URL,
        dir: path.join(__dirname, '../apps/atriz/migrations'),
    },
    followsite: {
        url: process.env.FOLLOWSITE_DATABASE_URL,
        dir: path.join(__dirname, '../apps/followsite/migrations'),
    },
    pshop: {
        url: process.env.PSHOP_DATABASE_URL,
        dir: path.join(__dirname, '../apps/pshop/migrations'),
    },
};

async function main() {
    const command = process.argv[2];
    const database = process.argv[3];
    const migrationName = process.argv[4];

    if (!command) {
        console.log(
            'Usage: node scripts/migrate.js <command> [database] [migration-name]'
        );
        console.log('');
        console.log('Commands:');
        console.log('  up        Run migrations up');
        console.log('  down      Run migrations down');
        console.log('  create    Create a new migration');
        console.log('  status    Show migration status');
        console.log('');
        console.log('Databases:');
        console.log('  core      Core database (auth, users)');
        console.log('  tracking  Tracking database (TimescaleDB)');
        console.log('  followsite Followsite database');
        console.log('  pshop     PShop database');
        console.log('  all       All databases');
        process.exit(1);
    }

    try {
        if (command === 'create') {
            if (!database || !migrationName) {
                console.error(
                    'Error: Database and migration name are required for create command'
                );
                console.log(
                    'Usage: node scripts/migrate.js create <database> <migration-name>'
                );
                process.exit(1);
            }

            const dbConfig = DATABASES[database];
            if (!dbConfig) {
                console.error(`Error: Unknown database '${database}'`);
                process.exit(1);
            }

            // Ensure migrations directory exists
            if (!fs.existsSync(dbConfig.dir)) {
                fs.mkdirSync(dbConfig.dir, { recursive: true });
            }

            await createMigration(migrationName, dbConfig.dir);
            console.log(`✓ Migration created: ${migrationName}`);
        } else if (command === 'status') {
            if (database === 'all') {
                for (const [dbName, dbConfig] of Object.entries(DATABASES)) {
                    if (dbConfig.url) {
                        console.log(`\n--- ${dbName.toUpperCase()} ---`);
                        const status = await getMigrationStatus({
                            databaseUrl: dbConfig.url,
                            migrationsDir: dbConfig.dir,
                        });
                        console.table(status);
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

                const status = await getMigrationStatus({
                    databaseUrl: dbConfig.url,
                    migrationsDir: dbConfig.dir,
                });
                console.table(status);
            }
        } else if (command === 'up' || command === 'down') {
            if (database === 'all') {
                for (const [dbName, dbConfig] of Object.entries(DATABASES)) {
                    if (dbConfig.url) {
                        console.log(
                            `\n--- Migrating ${dbName.toUpperCase()} ---`
                        );
                        await runMigrations({
                            databaseUrl: dbConfig.url,
                            migrationsDir: dbConfig.dir,
                            direction: command,
                        });
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

                await runMigrations({
                    databaseUrl: dbConfig.url,
                    migrationsDir: dbConfig.dir,
                    direction: command,
                });
            }
        } else {
            console.error(`Error: Unknown command '${command}'`);
            process.exit(1);
        }
    } catch (error) {
        console.error('Migration error:', error.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
