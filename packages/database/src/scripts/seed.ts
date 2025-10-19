import { sql } from '../client';
import fs from 'fs/promises';
import path from 'path';

async function runSeeders() {
  const env = process.env.NODE_ENV || 'development';

  console.log(`🌱 Running seeders for environment: ${env}\n`);

  try {
    const seedsDir = path.join(__dirname, '../seeds', env);

    // Check if seeds directory exists
    try {
      await fs.access(seedsDir);
    } catch {
      console.log(`ℹ️  No seeds directory found for ${env}`);
      return;
    }

    const files = await fs.readdir(seedsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log(`ℹ️  No seed files found for ${env}`);
      return;
    }

    for (const file of sqlFiles) {
      console.log(`⏳ Running seed: ${file}`);

      const content = await fs.readFile(path.join(seedsDir, file), 'utf-8');

      await sql.unsafe(content);

      console.log(`✅ Completed: ${file}\n`);
    }

    console.log(`\n✨ Successfully executed ${sqlFiles.length} seeder(s)!`);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runSeeders().catch((error) => {
  console.error(error);
  process.exit(1);
});
