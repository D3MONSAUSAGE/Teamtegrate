-- Create retraining settings table
CREATE TABLE public.training_retraining_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  course_id UUID NOT NULL,
  retraining_interval_months INTEGER NOT NULL DEFAULT 12,
  warning_period_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_retraining_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage retraining settings"
ON public.training_retraining_settings 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'superadmin', 'manager'])
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'superadmin', 'manager'])
  )
);

CREATE POLICY "Users can view retraining settings in their organization"
ON public.training_retraining_settings 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

-- Add retraining tracking columns to training_assignments
ALTER TABLE public.training_assignments ADD COLUMN IF NOT EXISTS is_retraining BOOLEAN DEFAULT false;
ALTER TABLE public.training_assignments ADD COLUMN IF NOT EXISTS original_assignment_id UUID;
ALTER TABLE public.training_assignments ADD COLUMN IF NOT EXISTS next_retraining_due TIMESTAMP WITH TIME ZONE;

-- Create retraining notifications table
CREATE TABLE public.training_retraining_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  assignment_id UUID,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('warning', 'overdue', 'escalation')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  escalation_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_retraining_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view retraining notifications in their organization"
ON public.training_retraining_notifications 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can insert retraining notifications"
ON public.training_retraining_notifications 
FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create function to check and create retraining assignments
CREATE OR REPLACE FUNCTION public.check_and_create_retraining_assignments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  retraining_setting RECORD;
  completed_assignment RECORD;
  new_due_date TIMESTAMP WITH TIME ZONE;
  warning_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Loop through all active retraining settings
  FOR retraining_setting IN 
    SELECT rs.*, tc.title as course_title
    FROM public.training_retraining_settings rs
    JOIN public.training_courses tc ON rs.course_id = tc.id
    WHERE rs.is_active = true
  LOOP
    -- Find completed assignments for this course that need retraining
    FOR completed_assignment IN
      SELECT ta.*, u.name as user_name, u.email as user_email
      FROM public.training_assignments ta
      JOIN public.users u ON ta.assigned_to = u.id
      WHERE ta.content_id = retraining_setting.course_id
        AND ta.assignment_type = 'course'
        AND ta.status = 'completed'
        AND ta.organization_id = retraining_setting.organization_id
        AND (ta.next_retraining_due IS NULL OR ta.next_retraining_due <= now())
        AND ta.completed_at IS NOT NULL
        AND ta.completed_at + (retraining_setting.retraining_interval_months || ' months')::interval <= now()
    LOOP
      -- Calculate new due date
      new_due_date := completed_assignment.completed_at + (retraining_setting.retraining_interval_months || ' months')::interval;
      warning_date := new_due_date - (retraining_setting.warning_period_days || ' days')::interval;
      
      -- Create new retraining assignment
      INSERT INTO public.training_assignments (
        organization_id,
        assigned_by,
        assigned_to,
        content_id,
        assignment_type,
        content_title,
        due_date,
        priority,
        status,
        is_retraining,
        original_assignment_id,
        notes
      ) VALUES (
        retraining_setting.organization_id,
        retraining_setting.created_by,
        completed_assignment.assigned_to,
        retraining_setting.course_id,
        'course',
        'Retraining: ' || retraining_setting.course_title,
        new_due_date,
        'high',
        'pending',
        true,
        completed_assignment.id,
        'Automatic retraining assignment created due to ' || retraining_setting.retraining_interval_months || ' month interval'
      );
      
      -- Update original assignment with next retraining due date
      UPDATE public.training_assignments 
      SET next_retraining_due = new_due_date + (retraining_setting.retraining_interval_months || ' months')::interval
      WHERE id = completed_assignment.id;
      
      -- Send warning notification if within warning period
      IF now() >= warning_date THEN
        INSERT INTO public.notifications (
          user_id,
          organization_id,
          title,
          content,
          type
        ) VALUES (
          completed_assignment.assigned_to::uuid,
          retraining_setting.organization_id,
          'Course Retraining Required',
          'You need to retake the course "' || retraining_setting.course_title || '" by ' || new_due_date::date,
          'retraining_due'
        );
        
        -- Log notification
        INSERT INTO public.training_retraining_notifications (
          organization_id,
          user_id,
          course_id,
          notification_type
        ) VALUES (
          retraining_setting.organization_id,
          completed_assignment.assigned_to::uuid,
          retraining_setting.course_id,
          'warning'
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Create trigger to update timestamps
CREATE TRIGGER update_retraining_settings_updated_at
BEFORE UPDATE ON public.training_retraining_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();