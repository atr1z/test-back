import { sql } from '../client';

async function rollback() {
  console.log('⏪ Rolling back last migration...\n');

  try {
    const lastMigration = await sql`
      SELECT name FROM migrations 
      ORDER BY executed_at DESC 
      LIMIT 1
    `;

    if (lastMigration.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return;
    }

    const migrationName = lastMigration[0].name;
    console.log(`❌ Removing migration record: ${migrationName}`);
    console.log('⚠️  Note: This only removes the record. You must manually rollback the schema changes.\n');

    await sql`DELETE FROM migrations WHERE name = ${migrationName}`;

    console.log('✅ Migration record removed');
    console.log('⚠️  Remember to manually revert the database changes!');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

rollback().catch((error) => {
  console.error(error);
  process.exit(1);
});
