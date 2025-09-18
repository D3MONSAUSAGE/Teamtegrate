-- Fix current email inconsistency for the user
-- This will update the database to match the current auth session email

-- Update the user's email in the database to match auth session
UPDATE public.users 
SET email = 'franciscolopez@guanatostacos.com'
WHERE id = '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d' 
  AND email = 'generalmanager@guanatostacos.com';

-- Log the fix
INSERT INTO public.compliance_audit_logs (
  user_id,
  organization_id,
  action,
  entity_type,
  entity_id,
  changes,
  ip_address,
  user_agent
) VALUES (
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'email_sync_fix',
  'user',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  jsonb_build_object(
    'old_email', 'generalmanager@guanatostacos.com',
    'new_email', 'franciscolopez@guanatostacos.com',
    'reason', 'Fix auth/database inconsistency'
  ),
  '127.0.0.1'::inet,
  'System Migration'
);