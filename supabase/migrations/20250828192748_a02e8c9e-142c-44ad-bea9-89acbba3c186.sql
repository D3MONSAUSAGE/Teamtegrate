-- Create training_assignments table to track course/quiz assignments
CREATE TABLE public.training_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_to UUID NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('course', 'quiz')),
  content_id UUID NOT NULL, -- References training_courses.id or quizzes.id
  content_title TEXT NOT NULL, -- Denormalized for easier querying
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for training assignments
CREATE POLICY "Users can view their own assignments"
  ON public.training_assignments FOR SELECT
  USING (
    organization_id = get_current_user_organization_id() AND
    assigned_to = auth.uid()
  );

CREATE POLICY "Admins can view all assignments in organization"
  ON public.training_assignments FOR SELECT
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
    )
  );

CREATE POLICY "Admins can create assignments"
  ON public.training_assignments FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    assigned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
    )
  );

CREATE POLICY "Assigned users can update their assignment status"
  ON public.training_assignments FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    assigned_to = auth.uid()
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    assigned_to = auth.uid()
  );

CREATE POLICY "Admins can update assignments in organization"
  ON public.training_assignments FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
    )
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_training_assignments_updated_at
  BEFORE UPDATE ON public.training_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_training_assignments_assigned_to ON public.training_assignments(assigned_to);
CREATE INDEX idx_training_assignments_organization ON public.training_assignments(organization_id);
CREATE INDEX idx_training_assignments_status ON public.training_assignments(status);
CREATE INDEX idx_training_assignments_due_date ON public.training_assignments(due_date);
CREATE INDEX idx_training_assignments_content ON public.training_assignments(assignment_type, content_id);