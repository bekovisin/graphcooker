-- Remove plain text password storage (security hardening)
ALTER TABLE users DROP COLUMN IF EXISTS plain_password;
