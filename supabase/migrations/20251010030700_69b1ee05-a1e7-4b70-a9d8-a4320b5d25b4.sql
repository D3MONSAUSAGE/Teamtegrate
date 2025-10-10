-- Add manager_id field to users table for reporting structure
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Add comment for documentation
COMMENT ON COLUMN users.manager_id IS 'References the user''s direct manager for organizational hierarchy';