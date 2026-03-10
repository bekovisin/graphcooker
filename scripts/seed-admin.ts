import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  const adminEmail = 'admin@graphcooker.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'bbolat71*';
  const adminName = 'Admin';

  console.log('Hashing admin password...');
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Insert admin user (or skip if exists)
  console.log('Inserting admin user...');
  const result = await sql`
    INSERT INTO users (email, name, password_hash, role)
    VALUES (${adminEmail}, ${adminName}, ${passwordHash}, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}, updated_at = NOW()
    RETURNING id
  `;
  const adminId = result[0].id;
  console.log(`Admin user id: ${adminId}`);

  // Assign all existing data to admin
  console.log('Assigning existing data to admin...');
  await sql`UPDATE folders SET user_id = ${adminId} WHERE user_id IS NULL`;
  await sql`UPDATE projects SET user_id = ${adminId} WHERE user_id IS NULL`;
  await sql`UPDATE visualizations SET user_id = ${adminId} WHERE user_id IS NULL`;
  await sql`UPDATE templates SET user_id = ${adminId} WHERE user_id IS NULL`;
  await sql`UPDATE color_themes SET user_id = ${adminId} WHERE user_id IS NULL AND is_built_in = false`;
  await sql`UPDATE preferences SET user_id = ${adminId} WHERE user_id IS NULL`;
  await sql`UPDATE dashboard_templates SET user_id = ${adminId} WHERE user_id IS NULL`;

  // Make userId NOT NULL (except color_themes which stays nullable for built-in)
  console.log('Making user_id columns NOT NULL...');
  await sql`ALTER TABLE folders ALTER COLUMN user_id SET NOT NULL`;
  await sql`ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL`;
  await sql`ALTER TABLE visualizations ALTER COLUMN user_id SET NOT NULL`;
  await sql`ALTER TABLE templates ALTER COLUMN user_id SET NOT NULL`;
  await sql`ALTER TABLE preferences ALTER COLUMN user_id SET NOT NULL`;
  await sql`ALTER TABLE dashboard_templates ALTER COLUMN user_id SET NOT NULL`;

  // Create compound unique index on preferences
  console.log('Creating compound unique index on preferences...');
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS preferences_user_key_idx ON preferences (user_id, key)`;

  console.log('Done! Admin seeded successfully.');
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
