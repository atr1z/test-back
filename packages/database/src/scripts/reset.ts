import { sql } from '../client';

async function resetDatabase() {
  const env = process.env.NODE_ENV;

  if (env === 'production') {
    console.error('❌ Cannot reset database in production environment!');
    process.exit(1);
  }

  console.log('⚠️  WARNING: This will drop all tables!\n');
  console.log('🗑️  Resetting database...\n');

  try {
    // Drop all tables
    await sql`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `;

    console.log('✅ Database reset complete\n');
    console.log('💡 Run "pnpm db:migrate" to recreate tables');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

resetDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
