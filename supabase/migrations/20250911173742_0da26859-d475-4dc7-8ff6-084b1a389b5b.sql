-- Create enum types for checklist system
CREATE TYPE checklist_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE checklist_status AS ENUM ('draft', 'active', 'inactive', 'archived');
CREATE TYPE execution_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'verified');
CREATE TYPE assignment_type AS ENUM ('individual', 'team', 'role_based');

-- Create checklists table (master templates)
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  priority checklist_priority NOT NULL DEFAULT 'medium',
  status checklist_status NOT NULL DEFAULT 'draft',
  assignment_type assignment_type NOT NULL DEFAULT 'individual',
  execution_window_start TIME,
  execution_window_end TIME,
  cutoff_time TIME,
  is_daily BOOLEAN NOT NULL DEFAULT true,
  branch_area TEXT,
  shift_type TEXT,
  scoring_enabled BOOLEAN NOT NULL DEFAULT true,
  verification_required BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT checklists_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  verification_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT checklist_items_checklist_fk FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Create checklist_assignments table
CREATE TABLE public.checklist_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  assigned_to_user_id UUID,
  assigned_to_team_id UUID,
  assigned_role TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT checklist_assignments_checklist_fk FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  CONSTRAINT checklist_assignments_check CHECK (
    (assigned_to_user_id IS NOT NULL AND assigned_to_team_id IS NULL AND assigned_role IS NULL) OR
    (assigned_to_user_id IS NULL AND assigned_to_team_id IS NOT NULL AND assigned_role IS NULL) OR
    (assigned_to_user_id IS NULL AND assigned_to_team_id IS NULL AND assigned_role IS NOT NULL)
  )
);

-- Create checklist_executions table (daily instances)
CREATE TABLE public.checklist_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  assigned_to_user_id UUID NOT NULL,
  execution_date DATE NOT NULL,
  status execution_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  execution_score DECIMAL(5,2) DEFAULT 0,
  verification_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT checklist_executions_checklist_fk FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
  CONSTRAINT checklist_executions_user_fk FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT checklist_executions_verified_by_fk FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT checklist_executions_unique_daily UNIQUE (checklist_id, assigned_to_user_id, execution_date)
);

-- Create checklist_execution_items table
CREATE TABLE public.checklist_execution_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL,
  checklist_item_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT checklist_execution_items_execution_fk FOREIGN KEY (execution_id) REFERENCES checklist_executions(id) ON DELETE CASCADE,
  CONSTRAINT checklist_execution_items_item_fk FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
  CONSTRAINT checklist_execution_items_verified_by_fk FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create checklist_comments table
CREATE TABLE public.checklist_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_item_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_verification_comment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT checklist_comments_execution_item_fk FOREIGN KEY (execution_item_id) REFERENCES checklist_execution_items(id) ON DELETE CASCADE,
  CONSTRAINT checklist_comments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_execution_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for checklists
CREATE POLICY "Users can view checklists in their organization" ON public.checklists
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create checklists" ON public.checklists
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

CREATE POLICY "Managers can update checklists" ON public.checklists
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Create RLS policies for checklist_items
CREATE POLICY "Users can view checklist items in their organization" ON public.checklist_items
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage checklist items" ON public.checklist_items
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Create RLS policies for checklist_assignments
CREATE POLICY "Users can view assignments in their organization" ON public.checklist_assignments
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage assignments" ON public.checklist_assignments
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Create RLS policies for checklist_executions
CREATE POLICY "Users can view their own executions" ON public.checklist_executions
  FOR SELECT USING (
    organization_id = get_current_user_organization_id() AND
    (assigned_to_user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')))
  );

CREATE POLICY "Users can update their own executions" ON public.checklist_executions
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    assigned_to_user_id = auth.uid()
  );

CREATE POLICY "Managers can verify executions" ON public.checklist_executions
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Create RLS policies for checklist_execution_items
CREATE POLICY "Users can view execution items in their organization" ON public.checklist_execution_items
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can update their own execution items" ON public.checklist_execution_items
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM checklist_executions WHERE id = execution_id AND assigned_to_user_id = auth.uid())
  );

CREATE POLICY "Managers can verify execution items" ON public.checklist_execution_items
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Create RLS policies for checklist_comments
CREATE POLICY "Users can view comments in their organization" ON public.checklist_comments
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create comments" ON public.checklist_comments
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    user_id = auth.uid()
  );

-- Create triggers for updated_at
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_executions_updated_at
  BEFORE UPDATE ON public.checklist_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_execution_items_updated_at
  BEFORE UPDATE ON public.checklist_execution_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate execution scores
CREATE OR REPLACE FUNCTION public.calculate_execution_score(execution_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  completion_rate DECIMAL;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN is_completed THEN 1 END)
  INTO total_items, completed_items
  FROM checklist_execution_items
  WHERE execution_id = execution_id_param;
  
  IF total_items = 0 THEN
    RETURN 0;
  END IF;
  
  completion_rate := (completed_items::DECIMAL / total_items::DECIMAL) * 100;
  
  RETURN completion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update execution scores
CREATE OR REPLACE FUNCTION public.update_execution_scores()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE checklist_executions
  SET 
    execution_score = calculate_execution_score(NEW.execution_id),
    total_score = COALESCE(calculate_execution_score(NEW.execution_id), 0) + COALESCE(verification_score, 0)
  WHERE id = NEW.execution_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update scores when items are completed
CREATE TRIGGER update_scores_on_item_completion
  AFTER UPDATE ON public.checklist_execution_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_scores();