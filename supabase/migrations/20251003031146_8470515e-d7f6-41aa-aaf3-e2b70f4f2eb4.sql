-- Create function to auto-insert notifications for task assignments
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if assigned_to_id changed and is not null
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id AND NEW.assigned_to_id IS NOT NULL) OR
     (TG_OP = 'INSERT' AND NEW.assigned_to_id IS NOT NULL) THEN
    
    INSERT INTO public.notifications (
      user_id,
      organization_id,
      title,
      content,
      type,
      task_id,
      created_at
    )
    VALUES (
      NEW.assigned_to_id::uuid,
      NEW.organization_id,
      'New Task Assigned',
      'You have been assigned to: ' || NEW.title,
      'task_assigned',
      NEW.id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task assignments
DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON public.tasks;
CREATE TRIGGER trigger_notify_task_assignment
  AFTER INSERT OR UPDATE OF assigned_to_id
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- Create function to auto-insert notifications for request status changes
CREATE OR REPLACE FUNCTION notify_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Notify requester
    INSERT INTO public.notifications (
      user_id,
      organization_id,
      title,
      content,
      type,
      created_at
    )
    VALUES (
      NEW.requester_id,
      NEW.organization_id,
      'Request Status Updated',
      'Your request "' || NEW.title || '" is now ' || NEW.status,
      'request_status_change',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for request status changes
DROP TRIGGER IF EXISTS trigger_notify_request_status ON public.requests;
CREATE TRIGGER trigger_notify_request_status
  AFTER UPDATE OF status
  ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_request_status_change();

-- Create function to auto-insert notifications for time entry approvals
CREATE OR REPLACE FUNCTION notify_time_entry_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if approval_status changed
  IF TG_OP = 'UPDATE' AND OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    
    INSERT INTO public.notifications (
      user_id,
      organization_id,
      title,
      content,
      type,
      created_at
    )
    VALUES (
      NEW.user_id,
      NEW.organization_id,
      'Time Entry ' || CASE 
        WHEN NEW.approval_status = 'approved' THEN 'Approved'
        WHEN NEW.approval_status = 'rejected' THEN 'Rejected'
        ELSE 'Updated'
      END,
      'Your time entry from ' || TO_CHAR(NEW.clock_in, 'Mon DD, YYYY') || ' has been ' || NEW.approval_status,
      'time_entry_approval',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for time entry approvals
DROP TRIGGER IF EXISTS trigger_notify_time_entry_approval ON public.time_entries;
CREATE TRIGGER trigger_notify_time_entry_approval
  AFTER UPDATE OF approval_status
  ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_time_entry_approval();