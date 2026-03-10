-- Migration: Add authentication system
-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Add userId columns (nullable first for migration)
ALTER TABLE folders ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE color_themes ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE preferences ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE dashboard_templates ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 4. Assign all existing data to admin user (id=1) after admin is seeded
-- This will be done by the seed script after inserting the admin user

-- 5. Drop old preferences unique index if exists, create compound one
DROP INDEX IF EXISTS preferences_key_idx;
