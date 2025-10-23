-- Add is_pending_invite column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_pending_invite BOOLEAN DEFAULT false;

-- Add index for faster lookups when processing invites
CREATE INDEX IF NOT EXISTS idx_users_pending_invite 
ON users(organization_id, email) 
WHERE is_pending_invite = true;

-- Add comment for documentation
COMMENT ON COLUMN users.is_pending_invite IS 'Indicates employee record exists but user has not been invited to platform yet';