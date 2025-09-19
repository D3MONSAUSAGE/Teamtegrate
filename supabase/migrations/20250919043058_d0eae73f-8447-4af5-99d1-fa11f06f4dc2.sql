-- Add enhanced task assignment columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to_ids text[],
ADD COLUMN IF NOT EXISTS assigned_to_names text[],
ADD COLUMN IF NOT EXISTS assignment_type text DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS assignment_source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS team_id text,
ADD COLUMN IF NOT EXISTS assignment_notes text;

-- Create task assignment audit table
CREATE TABLE IF NOT EXISTS public.task_assignment_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id text NOT NULL,
  organization_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  change_type text NOT NULL,
  old_assignment jsonb,
  new_assignment jsonb,
  change_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.task_assignment_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit table
CREATE POLICY "Users can view assignment audit in their organization" 
ON public.task_assignment_audit 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create assignment audit records" 
ON public.task_assignment_audit 
FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create function to log assignment changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assignment auditing
DROP TRIGGER IF EXISTS task_assignment_audit_trigger ON public.tasks;
CREATE TRIGGER task_assignment_audit_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_assignment_change();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_ids ON public.tasks USING GIN(assigned_to_ids);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignment_type ON public.tasks(assignment_type);
CREATE INDEX IF NOT EXISTS idx_task_assignment_audit_task_id ON public.task_assignment_audit(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignment_audit_organization ON public.task_assignment_audit(organization_id);