-- Fix foreign key relationship between requests and users tables
-- This resolves the PGRST200 error in the console logs

-- First, let's ensure we have proper foreign key constraints
ALTER TABLE public.requests 
ADD CONSTRAINT requests_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also add constraint for assigned_to if it doesn't exist
ALTER TABLE public.requests 
ADD CONSTRAINT requests_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_requests_requested_by ON public.requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON public.requests(assigned_to);

-- Add function to send notifications for request assignments
CREATE OR REPLACE FUNCTION public.send_notification_to_multiple(
  recipient_ids UUID[],
  title TEXT,
  content TEXT,
  notification_type TEXT DEFAULT 'system',
  metadata JSONB DEFAULT '{}'::jsonb,
  organization_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  user_org_id UUID;
BEGIN
  -- Get organization_id if not provided
  IF organization_id IS NULL THEN
    SELECT get_current_user_organization_id() INTO user_org_id;
  ELSE
    user_org_id := organization_id;
  END IF;

  -- Insert notification for each recipient
  FOREACH recipient_id IN ARRAY recipient_ids
  LOOP
    INSERT INTO public.notifications (
      user_id,
      organization_id,
      title,
      content,
      type,
      metadata,
      created_at
    ) VALUES (
      recipient_id,
      user_org_id,
      title,
      content,
      notification_type,
      metadata,
      NOW()
    );
  END LOOP;
END;
$$;