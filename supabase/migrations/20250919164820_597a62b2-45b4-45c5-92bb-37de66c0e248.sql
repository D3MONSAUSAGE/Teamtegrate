-- Fix: Remove problematic trigger that references non-existent 'assigned_to_name' field
-- This trigger is causing "record "old" has no field "assigned_to_name" error

-- First, drop any triggers that might be referencing the wrong field name
DROP TRIGGER IF EXISTS task_assignment_audit_trigger ON public.tasks;
DROP TRIGGER IF EXISTS log_task_assignment_changes ON public.tasks;
DROP TRIGGER IF EXISTS task_assignment_change_trigger ON public.tasks;

-- Drop related function if it exists (and has wrong field references)
DROP FUNCTION IF EXISTS public.log_task_assignment_change();

-- Create a corrected function that uses the actual field names
CREATE OR REPLACE FUNCTION public.log_task_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if assignment fields actually changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id OR 
    OLD.assigned_to_ids IS DISTINCT FROM NEW.assigned_to_ids OR
    OLD.assigned_to_names IS DISTINCT FROM NEW.assigned_to_names
  )) OR TG_OP = 'INSERT' THEN
    
    INSERT INTO public.compliance_audit_logs (
      user_id,
      organization_id,
      entity_type,
      entity_id,
      action,
      changes,
      created_at
    ) VALUES (
      auth.uid(),
      COALESCE(NEW.organization_id, OLD.organization_id),
      'task_assignment',
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      jsonb_build_object(
        'old_assigned_to_id', CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_to_id ELSE NULL END,
        'new_assigned_to_id', NEW.assigned_to_id,
        'old_assigned_to_ids', CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_to_ids ELSE NULL END,
        'new_assigned_to_ids', NEW.assigned_to_ids,
        'old_assigned_to_names', CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_to_names ELSE NULL END,
        'new_assigned_to_names', NEW.assigned_to_names,
        'timestamp', NOW()
      ),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger with the corrected function
CREATE TRIGGER task_assignment_audit_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_assignment_change();

-- Fix organization_id validation by ensuring it's never empty for tasks
-- Update any tasks with empty organization_id to NULL (which will trigger RLS properly)
UPDATE public.tasks 
SET organization_id = NULL 
WHERE organization_id = '' OR organization_id IS NULL;

-- Add a check to prevent empty organization_id in future inserts
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_organization_id_not_empty 
CHECK (organization_id IS NOT NULL AND organization_id != '');