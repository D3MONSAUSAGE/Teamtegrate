-- Add archived_at field to requests table for soft archive functionality
ALTER TABLE public.requests 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Create email notification preferences table
CREATE TABLE public.email_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  request_created BOOLEAN NOT NULL DEFAULT true,
  request_assigned BOOLEAN NOT NULL DEFAULT true,
  request_status_changed BOOLEAN NOT NULL DEFAULT true,
  request_completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on email preferences
ALTER TABLE public.email_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own email preferences
CREATE POLICY "Users can manage their own email preferences" 
ON public.email_notification_preferences 
FOR ALL 
USING (user_id = auth.uid());

-- Admins can view all preferences in their organization  
CREATE POLICY "Admins can view all email preferences in organization"
ON public.email_notification_preferences 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Add trigger for updated_at on email preferences
CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON public.email_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies on requests table to allow admin delete/archive
CREATE POLICY "Admins can delete requests in their organization"
ON public.requests 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Allow admins to update archived_at field
CREATE POLICY "Admins can archive requests in their organization"
ON public.requests 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Create function to get email notification recipients for a request
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
  
  -- Get request type details  
  SELECT * INTO rt_record FROM request_types WHERE id = req_record.request_type_id;
  
  -- Return requester
  RETURN QUERY
  SELECT u.id, u.email, u.name, 'requester'::TEXT
  FROM users u 
  WHERE u.id::text = req_record.requested_by;
  
  -- Return users with approval roles for this request type
  RETURN QUERY  
  SELECT DISTINCT u.id, u.email, u.name, 'approver'::TEXT
  FROM users u
  WHERE u.organization_id = req_record.organization_id 
    AND u.role = ANY(rt_record.approval_roles::text[])
    AND u.id::text != req_record.requested_by;
  
  -- Return assigned users if any
  IF req_record.assigned_to IS NOT NULL THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, 'assignee'::TEXT  
    FROM users u
    WHERE u.id::text = req_record.assigned_to
      AND u.id::text != req_record.requested_by;
  END IF;
END;
$$;