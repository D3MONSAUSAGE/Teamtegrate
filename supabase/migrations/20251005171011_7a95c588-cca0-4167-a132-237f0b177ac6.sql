-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to trigger push notifications for lower-priority notification types
CREATE OR REPLACE FUNCTION trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  should_push BOOLEAN;
  service_role_key TEXT;
BEGIN
  -- Only push for certain notification types (lower priority ones)
  should_push := NEW.type IN (
    'task_deadline_reminder',
    'task_status_change',
    'chat_room_invitation',
    'schedule_assignment'
  );

  IF should_push THEN
    -- Get service role key from vault (stored securely)
    -- Note: In production, this would come from a secure vault
    -- For now, we'll use the edge function's authentication
    
    -- Call edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := 'https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'content', NEW.content,
        'type', NEW.type,
        'metadata', COALESCE(NEW.metadata, '{}'::jsonb),
        'organization_id', NEW.organization_id,
        'send_push', true
      )
    );
    
    -- Log the background task initiation
    RAISE LOG 'Push notification triggered for user % with type %', NEW.user_id, NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS auto_push_notification ON notifications;
CREATE TRIGGER auto_push_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_notification();

-- Add comment for documentation
COMMENT ON FUNCTION trigger_push_notification() IS 'Automatically triggers push notifications for lower-priority notification types (task reminders, status changes, chat invites, schedules)';
COMMENT ON TRIGGER auto_push_notification ON notifications IS 'Sends push notifications via edge function for specific notification types';