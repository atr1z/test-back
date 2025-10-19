import { sql } from '../client';
import fs from 'fs/promises';
import path from 'path';

async function runMigrations() {
  console.log('🚀 Starting migrations...\n');

  try {
    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('ℹ️  No migration files found');
      return;
    }

    // Get already executed migrations
    const executed = await sql`SELECT name FROM migrations ORDER BY executed_at`;
    const executedNames = new Set(executed.map((row) => row.name));

    // Execute pending migrations
    let executedCount = 0;
    for (const file of sqlFiles) {
      if (!executedNames.has(file)) {
        console.log(`⏳ Running migration: ${file}`);

        const content = await fs.readFile(path.join(migrationsDir, file), 'utf-8');

        await sql.begin(async (sql) => {
          await sql.unsafe(content);
          await sql`INSERT INTO migrations (name) VALUES (${file})`;
        });

        console.log(`✅ Completed: ${file}\n`);
        executedCount++;
      } else {
        console.log(`⏭️  Skipping (already executed): ${file}`);
      }
    }

    if (executedCount === 0) {
      console.log('\n✨ All migrations are up to date!');
    } else {
      console.log(`\n✨ Successfully executed ${executedCount} migration(s)!`);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
