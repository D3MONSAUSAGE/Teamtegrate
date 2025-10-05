-- Create function to send upcoming checklist reminder notifications
-- This will be called by a cron job daily to remind users about checklists due the next day

CREATE OR REPLACE FUNCTION send_upcoming_checklist_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record RECORD;
  target_date DATE;
  day_of_week TEXT;
  user_record RECORD;
BEGIN
  -- Calculate tomorrow's date
  target_date := CURRENT_DATE + INTERVAL '1 day';
  day_of_week := LOWER(TO_CHAR(target_date, 'Day'));
  day_of_week := TRIM(day_of_week); -- Remove trailing spaces
  
  RAISE LOG 'Checking for checklist reminders for date: %, day: %', target_date, day_of_week;
  
  -- Find all active templates scheduled for tomorrow
  FOR template_record IN
    SELECT 
      ct.id as template_id,
      ct.name as template_name,
      ct.org_id,
      ct.team_id,
      ct.assignment_type,
      ct.role_key,
      ct.start_time,
      ct.end_time
    FROM checklist_templates_v2 ct
    WHERE ct.is_active = true
      AND day_of_week = ANY(ct.scheduled_days)
  LOOP
    RAISE LOG 'Found template: % (%) for %', template_record.template_name, template_record.template_id, target_date;
    
    -- Handle different assignment types
    IF template_record.assignment_type = 'team' AND template_record.team_id IS NOT NULL THEN
      -- Send to all team members
      FOR user_record IN
        SELECT DISTINCT u.id as user_id, u.organization_id
        FROM team_memberships tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = template_record.team_id
          AND u.organization_id = template_record.org_id
      LOOP
        -- Insert notification via send-push-notification edge function call using pg_net
        PERFORM net.http_post(
          url := 'https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4'
          ),
          body := jsonb_build_object(
            'type', 'checklist_reminder',
            'organization_id', user_record.organization_id,
            'user_ids', jsonb_build_array(user_record.user_id),
            'title', 'Checklist Due Tomorrow',
            'body', format('Reminder: "%s" is scheduled for tomorrow', template_record.template_name),
            'data', jsonb_build_object(
              'template_id', template_record.template_id,
              'scheduled_date', target_date,
              'route', '/dashboard/checklists'
            )
          )
        );
        
        RAISE LOG 'Sent reminder to user % for template %', user_record.user_id, template_record.template_id;
      END LOOP;
      
    ELSIF template_record.assignment_type = 'role' AND template_record.role_key IS NOT NULL THEN
      -- Send to all users with the specified role
      FOR user_record IN
        SELECT u.id as user_id, u.organization_id
        FROM users u
        WHERE u.organization_id = template_record.org_id
          AND u.role = template_record.role_key
      LOOP
        -- Insert notification via send-push-notification edge function call using pg_net
        PERFORM net.http_post(
          url := 'https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/send-push-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4'
          ),
          body := jsonb_build_object(
            'type', 'checklist_reminder',
            'organization_id', user_record.organization_id,
            'user_ids', jsonb_build_array(user_record.user_id),
            'title', 'Checklist Due Tomorrow',
            'body', format('Reminder: "%s" is scheduled for tomorrow', template_record.template_name),
            'data', jsonb_build_object(
              'template_id', template_record.template_id,
              'scheduled_date', target_date,
              'route', '/dashboard/checklists'
            )
          )
        );
        
        RAISE LOG 'Sent reminder to user % for template %', user_record.user_id, template_record.template_id;
      END LOOP;
    END IF;
  END LOOP;
  
  RAISE LOG 'Finished sending checklist reminders for %', target_date;
END;
$$;

-- Create cron job to run daily at 6 PM (18:00) to remind about next day's checklists
-- This timing allows users to see the notification in the evening before the checklist is due
SELECT cron.schedule(
  'send-upcoming-checklist-reminders',
  '0 18 * * *', -- Run at 6 PM every day
  $$
  SELECT send_upcoming_checklist_reminders();
  $$
);

-- Log the cron job creation
DO $$
BEGIN
  RAISE LOG 'Created cron job: send-upcoming-checklist-reminders to run daily at 6 PM';
END $$;