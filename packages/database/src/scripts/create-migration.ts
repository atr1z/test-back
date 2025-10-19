import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createMigration() {
  try {
    const name = await question('Migration name (e.g., add_users_table): ');

    if (!name || name.trim() === '') {
      console.error('❌ Migration name is required');
      process.exit(1);
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${name.trim().replace(/\s+/g, '_')}.sql`;
    const migrationsDir = path.join(__dirname, '../migrations');
    const filePath = path.join(migrationsDir, fileName);

    const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Add your SQL here


-- Rollback (optional, for documentation):
-- Add rollback SQL as comments
`;

    await fs.writeFile(filePath, template, 'utf-8');

    console.log(`\n✅ Migration created: ${fileName}`);
    console.log(`📝 File location: ${filePath}\n`);
  } catch (error) {
    console.error('❌ Failed to create migration:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createMigration();
