-- Create employee actions table for warnings and coachings
CREATE TABLE public.employee_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  issued_by UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('verbal_warning', 'written_warning', 'final_warning', 'performance_coaching', 'behavioral_coaching', 'career_coaching', 'compliance_coaching')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  category TEXT NOT NULL CHECK (category IN ('attendance', 'performance', 'policy_violation', 'safety', 'customer_service', 'team_collaboration', 'professional_conduct', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  improvement_plan TEXT,
  expected_outcomes TEXT,
  follow_up_date DATE,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'escalated', 'appealed')) DEFAULT 'active',
  is_confidential BOOLEAN NOT NULL DEFAULT true,
  team_id UUID,
  job_role_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  escalation_count INTEGER DEFAULT 0,
  appeal_submitted_at TIMESTAMP WITH TIME ZONE,
  appeal_reason TEXT
);

-- Create action participants table for tracking involvement
CREATE TABLE public.action_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.employee_actions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('issuer', 'recipient', 'witness', 'supervisor', 'hr_rep')),
  signature_status TEXT CHECK (signature_status IN ('pending', 'signed', 'declined')) DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create action follow-ups table for tracking progress
CREATE TABLE public.action_follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.employee_actions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  conducted_by UUID NOT NULL,
  follow_up_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',
  progress_rating INTEGER CHECK (progress_rating BETWEEN 1 AND 5),
  progress_notes TEXT NOT NULL,
  next_steps TEXT,
  next_follow_up_date DATE,
  is_improvement_shown BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create action templates table for common scenarios
CREATE TABLE public.action_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL,
  template_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('verbal_warning', 'written_warning', 'final_warning', 'performance_coaching', 'behavioral_coaching', 'career_coaching', 'compliance_coaching')),
  category TEXT NOT NULL CHECK (category IN ('attendance', 'performance', 'policy_violation', 'safety', 'customer_service', 'team_collaboration', 'professional_conduct', 'other')),
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  improvement_plan_template TEXT,
  expected_outcomes_template TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employee_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_actions
CREATE POLICY "Users can view actions in their organization" 
ON public.employee_actions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create actions for their team members" 
ON public.employee_actions 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND issued_by = auth.uid()
  AND (
    -- Superadmins and admins can issue to anyone
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
    OR
    -- Managers can issue to their team members
    (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'team_leader'))
      AND recipient_id IN (
        SELECT tm.user_id 
        FROM public.team_memberships tm
        JOIN public.teams t ON tm.team_id = t.id
        WHERE t.manager_id = auth.uid() OR t.id = team_id
      )
    )
  )
);

CREATE POLICY "Issuers and admins can update actions" 
ON public.employee_actions 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    issued_by = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  )
);

-- Create policies for action_participants
CREATE POLICY "Users can view participants for actions they can see" 
ON public.action_participants 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND action_id IN (SELECT id FROM public.employee_actions WHERE organization_id = get_current_user_organization_id())
);

CREATE POLICY "Managers can add participants to actions they created" 
ON public.action_participants 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND action_id IN (
    SELECT id FROM public.employee_actions 
    WHERE issued_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  )
);

-- Create policies for action_follow_ups
CREATE POLICY "Users can view follow-ups in their organization" 
ON public.action_follow_ups 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create follow-ups for their actions" 
ON public.action_follow_ups 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND conducted_by = auth.uid()
  AND action_id IN (
    SELECT id FROM public.employee_actions 
    WHERE issued_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  )
);

CREATE POLICY "Conductors can update their follow-ups" 
ON public.action_follow_ups 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND conducted_by = auth.uid()
);

-- Create policies for action_templates
CREATE POLICY "Users can view templates in their organization" 
ON public.action_templates 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create templates" 
ON public.action_templates 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager', 'team_leader'))
);

CREATE POLICY "Template creators can update their templates" 
ON public.action_templates 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_employee_actions_organization_id ON public.employee_actions(organization_id);
CREATE INDEX idx_employee_actions_recipient_id ON public.employee_actions(recipient_id);
CREATE INDEX idx_employee_actions_issued_by ON public.employee_actions(issued_by);
CREATE INDEX idx_employee_actions_team_id ON public.employee_actions(team_id);
CREATE INDEX idx_employee_actions_status ON public.employee_actions(status);
CREATE INDEX idx_employee_actions_created_at ON public.employee_actions(created_at);

CREATE INDEX idx_action_participants_action_id ON public.action_participants(action_id);
CREATE INDEX idx_action_participants_user_id ON public.action_participants(user_id);

CREATE INDEX idx_action_follow_ups_action_id ON public.action_follow_ups(action_id);
CREATE INDEX idx_action_follow_ups_follow_up_date ON public.action_follow_ups(follow_up_date);

-- Create triggers for updated_at
CREATE TRIGGER update_employee_actions_updated_at
  BEFORE UPDATE ON public.employee_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_follow_ups_updated_at
  BEFORE UPDATE ON public.action_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_templates_updated_at
  BEFORE UPDATE ON public.action_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user can issue action to recipient
CREATE OR REPLACE FUNCTION public.can_user_issue_action_to_recipient(issuer_id UUID, recipient_id UUID, organization_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  issuer_role TEXT;
BEGIN
  -- Get issuer role
  SELECT role INTO issuer_role
  FROM public.users 
  WHERE id = issuer_id AND organization_id = can_user_issue_action_to_recipient.organization_id;
  
  -- Superadmins and admins can issue to anyone
  IF issuer_role IN ('superadmin', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Managers and team leaders can issue to their team members
  IF issuer_role IN ('manager', 'team_leader') THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.team_memberships tm
      JOIN public.teams t ON tm.team_id = t.id
      WHERE tm.user_id = recipient_id
        AND t.manager_id = issuer_id
        AND t.organization_id = can_user_issue_action_to_recipient.organization_id
    );
  END IF;
  
  RETURN false;
END;
$$;