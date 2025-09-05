-- Create meeting analytics table for effectiveness tracking
CREATE TABLE public.meeting_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_request_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  effectiveness_score INTEGER DEFAULT 0, -- 0-100 score
  engagement_score INTEGER DEFAULT 0, -- 0-100 score  
  completion_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage of goals completed
  follow_through_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage of action items completed
  time_efficiency_score INTEGER DEFAULT 0, -- how well meeting stayed on schedule
  participant_satisfaction_avg DECIMAL(3,2) DEFAULT 0.00, -- average satisfaction 1-5
  roi_score INTEGER DEFAULT 0, -- return on investment score
  meeting_duration_minutes INTEGER DEFAULT 0,
  actual_vs_planned_ratio DECIMAL(4,2) DEFAULT 1.00, -- actual time vs planned time
  action_items_created INTEGER DEFAULT 0,
  action_items_completed INTEGER DEFAULT 0,
  goals_set INTEGER DEFAULT 0,
  goals_achieved INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  active_participants INTEGER DEFAULT 0, -- participants who contributed
  cost_estimate DECIMAL(10,2) DEFAULT 0.00, -- estimated cost based on participant time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting action items table
CREATE TABLE public.meeting_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_request_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_id UUID, -- user assigned to complete this
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create meeting participant feedback table
CREATE TABLE public.meeting_participant_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_request_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  engagement_level TEXT CHECK (engagement_level IN ('low', 'medium', 'high')),
  time_well_used BOOLEAN DEFAULT true,
  would_attend_again BOOLEAN DEFAULT true,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_request_id, user_id)
);

-- Create meeting conflicts table for smart conflict detection
CREATE TABLE public.meeting_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_request_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('scheduling', 'resource', 'participant_overload', 'room_booking')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  suggested_resolution TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting templates table for reusable meeting structures
CREATE TABLE public.meeting_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER DEFAULT 60,
  agenda_structure JSONB DEFAULT '[]'::jsonb, -- structured agenda items
  default_participants JSONB DEFAULT '[]'::jsonb, -- default participant roles/ids
  meeting_type TEXT DEFAULT 'general' CHECK (meeting_type IN ('standup', 'planning', 'retrospective', 'review', 'general', 'all_hands')),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- for recurring meetings
  estimated_effectiveness_score INTEGER DEFAULT 75,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.meeting_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participant_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meeting_analytics
CREATE POLICY "Users can view analytics for their organization meetings" 
ON public.meeting_analytics FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.meeting_requests mr 
    WHERE mr.id = meeting_analytics.meeting_request_id 
    AND mr.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Meeting organizers and admins can manage analytics" 
ON public.meeting_analytics FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND 
  (
    is_meeting_organizer(meeting_request_id, auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
  )
);

-- Create RLS policies for meeting_action_items
CREATE POLICY "Users can view action items for their organization meetings" 
ON public.meeting_action_items FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Meeting organizers can create action items" 
ON public.meeting_action_items FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  created_by = auth.uid() AND
  is_meeting_organizer(meeting_request_id, auth.uid())
);

CREATE POLICY "Action item assignees can update their items" 
ON public.meeting_action_items FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  (assigned_to_id = auth.uid() OR is_meeting_organizer(meeting_request_id, auth.uid()))
);

-- Create RLS policies for meeting_participant_feedback
CREATE POLICY "Users can manage their own feedback" 
ON public.meeting_participant_feedback FOR ALL 
USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Meeting organizers can view all feedback" 
ON public.meeting_participant_feedback FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  is_meeting_organizer(meeting_request_id, auth.uid())
);

-- Create RLS policies for meeting_conflicts
CREATE POLICY "Users can view conflicts for their organization meetings" 
ON public.meeting_conflicts FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System and admins can manage conflicts" 
ON public.meeting_conflicts FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- Create RLS policies for meeting_templates
CREATE POLICY "Users can view templates in their organization" 
ON public.meeting_templates FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage meeting templates" 
ON public.meeting_templates FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- Create indexes for better performance
CREATE INDEX idx_meeting_analytics_meeting_id ON public.meeting_analytics(meeting_request_id);
CREATE INDEX idx_meeting_analytics_org_id ON public.meeting_analytics(organization_id);
CREATE INDEX idx_meeting_action_items_meeting_id ON public.meeting_action_items(meeting_request_id);
CREATE INDEX idx_meeting_action_items_assignee ON public.meeting_action_items(assigned_to_id);
CREATE INDEX idx_meeting_participant_feedback_meeting_id ON public.meeting_participant_feedback(meeting_request_id);
CREATE INDEX idx_meeting_conflicts_meeting_id ON public.meeting_conflicts(meeting_request_id);
CREATE INDEX idx_meeting_templates_org_id ON public.meeting_templates(organization_id);

-- Create function to calculate meeting effectiveness score
CREATE OR REPLACE FUNCTION public.calculate_meeting_effectiveness(meeting_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  analytics_record RECORD;
  score INTEGER := 0;
BEGIN
  SELECT * INTO analytics_record 
  FROM public.meeting_analytics 
  WHERE meeting_request_id = meeting_id;
  
  IF FOUND THEN
    -- Calculate composite effectiveness score (0-100)
    score := GREATEST(0, LEAST(100, 
      (COALESCE(analytics_record.completion_rate, 0) * 0.3) +
      (COALESCE(analytics_record.follow_through_rate, 0) * 0.25) +
      (COALESCE(analytics_record.engagement_score, 0) * 0.2) +
      (COALESCE(analytics_record.time_efficiency_score, 0) * 0.15) +
      (COALESCE(analytics_record.participant_satisfaction_avg * 20, 0) * 0.1)
    ));
  END IF;
  
  RETURN score;
END;
$$;

-- Create trigger to update updated_at columns
CREATE TRIGGER update_meeting_analytics_updated_at
  BEFORE UPDATE ON public.meeting_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_action_items_updated_at
  BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_templates_updated_at
  BEFORE UPDATE ON public.meeting_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();