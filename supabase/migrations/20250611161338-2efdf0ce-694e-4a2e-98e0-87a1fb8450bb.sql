
-- Add organization_id to remaining core tables for multi-tenancy (fixed version)

-- 1. Add organization_id columns as nullable first
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 2. Get the default Legacy Org ID for orphaned records
DO $$ 
DECLARE
  legacy_org_id UUID;
BEGIN
  SELECT id INTO legacy_org_id FROM organizations WHERE name = 'Legacy Org';
  
  -- If Legacy Org doesn't exist, create it
  IF legacy_org_id IS NULL THEN
    INSERT INTO organizations (id, name, created_by, created_at)
    VALUES (gen_random_uuid(), 'Legacy Org', (SELECT id FROM users LIMIT 1), NOW())
    RETURNING id INTO legacy_org_id;
  END IF;

  -- 3. Update existing records to inherit organization_id from users, with fallback to Legacy Org
  UPDATE comments 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM users WHERE users.id = comments.user_id),
    legacy_org_id
  ) 
  WHERE organization_id IS NULL;

  UPDATE chat_messages 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM users WHERE users.id = chat_messages.user_id),
    legacy_org_id
  ) 
  WHERE organization_id IS NULL;

  UPDATE chat_rooms 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM users WHERE users.id = chat_rooms.created_by),
    legacy_org_id
  ) 
  WHERE organization_id IS NULL;

  UPDATE documents 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM users WHERE users.id = documents.user_id),
    legacy_org_id
  ) 
  WHERE organization_id IS NULL;

  UPDATE notifications 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM users WHERE users.id = notifications.user_id),
    legacy_org_id
  ) 
  WHERE organization_id IS NULL;

  UPDATE time_entries 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM users WHERE users.id = time_entries.user_id),
    legacy_org_id
  ) 
  WHERE organization_id IS NULL;
END $$;

-- 4. Make organization_id NOT NULL after populating data
ALTER TABLE comments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE chat_rooms ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE time_entries ALTER COLUMN organization_id SET NOT NULL;

-- 5. Enable RLS on all tables (if not already enabled)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can only access comments from their organization" ON comments;
DROP POLICY IF EXISTS "Users can only access messages from their organization" ON chat_messages;
DROP POLICY IF EXISTS "Users can only access rooms from their organization" ON chat_rooms;
DROP POLICY IF EXISTS "Users can only access documents from their organization" ON documents;
DROP POLICY IF EXISTS "Users can only access notifications from their organization" ON notifications;
DROP POLICY IF EXISTS "Users can only access time entries from their organization" ON time_entries;

-- Comments RLS policies
CREATE POLICY "Users can only access comments from their organization" ON comments
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Chat Messages RLS policies
CREATE POLICY "Users can only access messages from their organization" ON chat_messages
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Chat Rooms RLS policies
CREATE POLICY "Users can only access rooms from their organization" ON chat_rooms
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Documents RLS policies
CREATE POLICY "Users can only access documents from their organization" ON documents
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Notifications RLS policies
CREATE POLICY "Users can only access notifications from their organization" ON notifications
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Time Entries RLS policies
CREATE POLICY "Users can only access time entries from their organization" ON time_entries
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 7. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_comments_organization_id ON comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_organization_id ON chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_organization_id ON chat_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON time_entries(organization_id);
