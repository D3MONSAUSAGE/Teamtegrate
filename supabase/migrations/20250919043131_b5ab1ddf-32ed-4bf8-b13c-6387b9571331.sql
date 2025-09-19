-- Fix security issue: Update function with proper search_path
CREATE OR REPLACE FUNCTION public.log_task_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  old_assignment jsonb;
  new_assignment jsonb;
BEGIN
  -- Build old assignment object
  IF TG_OP = 'UPDATE' THEN
    old_assignment := jsonb_build_object(
      'assigned_to_id', OLD.assigned_to_id,
      'assigned_to_name', OLD.assigned_to_name,
      'assigned_to_ids', OLD.assigned_to_ids,
      'assigned_to_names', OLD.assigned_to_names,
      'assignment_type', OLD.assignment_type,
      'assignment_source', OLD.assignment_source,
      'team_id', OLD.team_id
    );
  END IF;

  -- Build new assignment object
  new_assignment := jsonb_build_object(
    'assigned_to_id', NEW.assigned_to_id,
    'assigned_to_name', NEW.assigned_to_name,
    'assigned_to_ids', NEW.assigned_to_ids,
    'assigned_to_names', NEW.assigned_to_names,
    'assignment_type', NEW.assignment_type,
    'assignment_source', NEW.assignment_source,
    'team_id', NEW.team_id
  );

  -- Only log if assignment actually changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND old_assignment IS DISTINCT FROM new_assignment) THEN
    INSERT INTO public.task_assignment_audit (
      task_id,
      organization_id,
      changed_by,
      change_type,
      old_assignment,
      new_assignment,
      change_reason
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      auth.uid(),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
      END,
      old_assignment,
      new_assignment,
      'Manual assignment change'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';