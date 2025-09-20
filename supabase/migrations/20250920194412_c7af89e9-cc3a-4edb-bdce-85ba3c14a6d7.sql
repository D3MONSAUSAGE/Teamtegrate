-- Fix the get_request_notification_recipients function with proper type casting
CREATE OR REPLACE FUNCTION get_request_notification_recipients(request_id_param UUID)
RETURNS TABLE(user_id UUID, email TEXT, name TEXT, notification_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record RECORD;
  rt_record RECORD;
BEGIN
  -- Get request details
  SELECT * INTO req_record FROM requests WHERE id = request_id_param;
  
  IF req_record IS NULL THEN
    RAISE NOTICE 'Request not found for ID: %', request_id_param;
    RETURN;
  END IF;
  
  -- Get request type details  
  SELECT * INTO rt_record FROM request_types WHERE id = req_record.request_type_id;
  
  IF rt_record IS NULL THEN
    RAISE NOTICE 'Request type not found for ID: %', req_record.request_type_id;
    RETURN;
  END IF;
  
  -- Return requester (fix type casting issue)
  RETURN QUERY
  SELECT u.id, u.email, u.name, 'requester'::TEXT
  FROM users u 
  WHERE u.id = req_record.requested_by::uuid;
  
  -- Return users with approval roles for this request type (fix type casting)
  RETURN QUERY  
  SELECT DISTINCT u.id, u.email, u.name, 'approver'::TEXT
  FROM users u
  WHERE u.organization_id = req_record.organization_id 
    AND u.role = ANY(rt_record.approval_roles::text[])
    AND u.id != req_record.requested_by::uuid;
  
  -- Return assigned users if any (fix type casting)
  IF req_record.assigned_to IS NOT NULL AND req_record.assigned_to != '' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, 'assignee'::TEXT  
    FROM users u
    WHERE u.id = req_record.assigned_to::uuid
      AND u.id != req_record.requested_by::uuid;
  END IF;
END;
$$;

-- Create default email notification preferences for all existing users
INSERT INTO email_notification_preferences (user_id, organization_id, request_created, request_assigned, request_status_changed, request_completed)
SELECT 
  u.id,
  u.organization_id,
  true, -- request_created
  true, -- request_assigned  
  true, -- request_status_changed
  true  -- request_completed
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM email_notification_preferences enp 
  WHERE enp.user_id = u.id
);