import { neon } from '@neondatabase/serverless';

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  // 1. Create users table
  console.log('Creating users table...');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log('  ✓ users table created');

  // 2. Create sessions table
  console.log('Creating sessions table...');
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log('  ✓ sessions table created');

  // 3. Add userId columns
  console.log('Adding user_id columns...');
  const alterStatements = [
    sql`ALTER TABLE folders ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    sql`ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    sql`ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    sql`ALTER TABLE color_themes ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    sql`ALTER TABLE preferences ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    sql`ALTER TABLE dashboard_templates ADD COLUMN IF NOT EXISTS user_id INTEGER`,
  ];
  await Promise.all(alterStatements);
  console.log('  ✓ user_id columns added');

  // 4. Add is_shared to templates
  console.log('Adding is_shared to templates...');
  await sql`ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false`;
  console.log('  ✓ is_shared column added');

  // 5. Drop old preferences unique index
  console.log('Dropping old preferences index...');
  await sql`DROP INDEX IF EXISTS preferences_key_idx`;
  console.log('  ✓ Old index dropped');

  console.log('\nMigration complete!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
