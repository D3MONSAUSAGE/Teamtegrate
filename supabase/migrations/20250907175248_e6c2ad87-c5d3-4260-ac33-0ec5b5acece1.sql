-- Create utility function to find user's team manager
CREATE OR REPLACE FUNCTION public.get_user_team_manager(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  manager_user_id uuid;
BEGIN
  -- Look up the user's team manager via team_memberships
  SELECT DISTINCT t.manager_id::uuid INTO manager_user_id
  FROM public.team_memberships tm
  JOIN public.teams t ON tm.team_id = t.id
  WHERE tm.user_id = target_user_id 
    AND t.manager_id IS NOT NULL 
    AND t.is_active = true
  LIMIT 1;
  
  RETURN manager_user_id;
END;
$$;

-- Function to send notifications to multiple recipients
CREATE OR REPLACE FUNCTION public.send_notification_to_multiple(
  recipient_ids uuid[],
  notification_title text,
  notification_content text,
  notification_type text,
  org_id uuid,
  related_task_id text DEFAULT NULL,
  related_event_id uuid DEFAULT NULL,
  metadata_json jsonb DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recipient_id uuid;
  inserted_count int := 0;
BEGIN
  -- Insert notification for each recipient
  FOREACH recipient_id IN ARRAY recipient_ids
  LOOP
    INSERT INTO public.notifications (
      user_id,
      organization_id,
      title,
      content,
      type,
      task_id,
      event_id,
      metadata
    ) VALUES (
      recipient_id,
      org_id,
      notification_title,
      notification_content,
      notification_type,
      related_task_id,
      related_event_id,
      metadata_json
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

-- Create time entry correction request type
INSERT INTO public.request_types (
  organization_id,
  name,
  description,
  category,
  form_schema,
  requires_approval,
  approval_roles,
  created_by
)
SELECT 
  o.id,
  'Time Entry Correction',
  'Request correction of time entry records (clock in/out times, breaks, etc.)',
  'time_schedule',
  '[
    {
      "field": "original_date",
      "type": "date",
      "label": "Date of Time Entry",
      "required": true,
      "placeholder": "Select the date"
    },
    {
      "field": "original_clock_in",
      "type": "text",
      "label": "Original Clock In Time",
      "required": true,
      "placeholder": "e.g., 9:00 AM"
    },
    {
      "field": "original_clock_out",
      "type": "text",
      "label": "Original Clock Out Time",
      "required": false,
      "placeholder": "e.g., 5:00 PM (if applicable)"
    },
    {
      "field": "corrected_clock_in",
      "type": "text",
      "label": "Corrected Clock In Time",
      "required": true,
      "placeholder": "e.g., 8:30 AM"
    },
    {
      "field": "corrected_clock_out",
      "type": "text",
      "label": "Corrected Clock Out Time",
      "required": false,
      "placeholder": "e.g., 5:30 PM (if applicable)"
    },
    {
      "field": "reason",
      "type": "textarea",
      "label": "Reason for Correction",
      "required": true,
      "placeholder": "Please explain why this correction is needed..."
    },
    {
      "field": "additional_notes",
      "type": "textarea",
      "label": "Additional Notes",
      "required": false,
      "placeholder": "Any additional context or information..."
    }
  ]'::jsonb,
  true,
  ARRAY['manager', 'admin', 'superadmin'],
  u.id
FROM public.organizations o
CROSS JOIN (
  SELECT id FROM public.users 
  WHERE role IN ('admin', 'superadmin') 
  LIMIT 1
) u
WHERE NOT EXISTS (
  SELECT 1 FROM public.request_types rt 
  WHERE rt.organization_id = o.id 
    AND rt.name = 'Time Entry Correction'
);