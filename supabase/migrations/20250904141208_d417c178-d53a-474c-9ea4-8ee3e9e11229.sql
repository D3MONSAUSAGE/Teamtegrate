-- Add reassignment fields to training_assignments table
ALTER TABLE public.training_assignments 
ADD COLUMN reassigned_from uuid REFERENCES public.training_assignments(id) ON DELETE SET NULL,
ADD COLUMN reassigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN reassignment_reason text,
ADD COLUMN reassignment_date timestamp with time zone;

-- Create training assignment audit table for tracking reassignments
CREATE TABLE public.training_assignment_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  assignment_id uuid NOT NULL REFERENCES public.training_assignments(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('created', 'reassigned', 'completed', 'status_changed')),
  performed_by uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.training_assignment_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit table
CREATE POLICY "Users can view audit records in their organization"
ON public.training_assignment_audit
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can insert audit records"
ON public.training_assignment_audit
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND performed_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- Add index for performance
CREATE INDEX idx_training_assignment_audit_assignment_id ON public.training_assignment_audit(assignment_id);
CREATE INDEX idx_training_assignment_audit_organization_id ON public.training_assignment_audit(organization_id);

-- Update trigger for training assignments to log changes
CREATE OR REPLACE FUNCTION public.log_training_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change to audit table
  INSERT INTO public.training_assignment_audit (
    organization_id,
    assignment_id,
    action_type,
    performed_by,
    old_values,
    new_values,
    reason
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND NEW.reassigned_by IS NOT NULL AND OLD.reassigned_by IS NULL THEN 'reassigned'
      WHEN TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN 'status_changed'
      ELSE 'updated'
    END,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.reassignment_reason ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER training_assignment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.training_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_training_assignment_changes();