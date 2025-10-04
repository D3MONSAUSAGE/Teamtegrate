-- ====================================
-- RECRUITMENT/ATS SYSTEM - COMPLETE DATABASE SCHEMA
-- ====================================

-- Create enums for type safety
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary');
CREATE TYPE position_status AS ENUM ('open', 'closed', 'on_hold');
CREATE TYPE candidate_status AS ENUM ('active', 'hired', 'rejected', 'withdrawn');
CREATE TYPE candidate_source AS ENUM ('indeed', 'linkedin', 'referral', 'direct', 'other');
CREATE TYPE interview_type AS ENUM ('phone', 'in_person', 'video', 'technical', 'panel');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');
CREATE TYPE feedback_recommendation AS ENUM ('proceed', 'reject', 'unsure');
CREATE TYPE call_status AS ENUM ('not_called', 'answered', 'voicemail', 'no_answer', 'invalid_number');
CREATE TYPE reference_rating AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE note_type AS ENUM ('general', 'interview_feedback', 'red_flag', 'strength', 'question');
CREATE TYPE document_type AS ENUM ('resume', 'cover_letter', 'portfolio', 'reference_letter', 'other');
CREATE TYPE approval_decision AS ENUM ('approved', 'rejected', 'more_info_needed');
CREATE TYPE email_type AS ENUM ('interview_invitation', 'interview_reminder', 'interview_reschedule', 'rejection', 'offer', 'welcome');
CREATE TYPE email_status AS ENUM ('sent', 'failed', 'bounced');
CREATE TYPE stage_type AS ENUM ('applied', 'screening', 'interview', 'assessment', 'approval', 'offer', 'hired', 'rejected');

-- ====================================
-- TABLE 1: recruitment_pipeline_stages
-- ====================================
CREATE TABLE public.recruitment_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_type stage_type NOT NULL,
  color_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, stage_order)
);

ALTER TABLE public.recruitment_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipeline stages in their org"
  ON public.recruitment_pipeline_stages FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage pipeline stages"
  ON public.recruitment_pipeline_stages FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 2: recruitment_positions
-- ====================================
CREATE TABLE public.recruitment_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type employment_type NOT NULL,
  job_description TEXT,
  requirements TEXT,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  status position_status NOT NULL DEFAULT 'open',
  posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_hire_date DATE,
  hiring_manager_id UUID REFERENCES public.users(id),
  hr_recruiter_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view positions in their org"
  ON public.recruitment_positions FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage positions"
  ON public.recruitment_positions FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 3: recruitment_candidates
-- ====================================
CREATE TABLE public.recruitment_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.recruitment_positions(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter_url TEXT,
  source candidate_source NOT NULL DEFAULT 'direct',
  source_details TEXT,
  current_stage_id UUID REFERENCES public.recruitment_pipeline_stages(id),
  overall_rating NUMERIC CHECK (overall_rating >= 1 AND overall_rating <= 5),
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status candidate_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view candidates in their org"
  ON public.recruitment_candidates FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage candidates"
  ON public.recruitment_candidates FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 4: recruitment_candidate_stages
-- ====================================
CREATE TABLE public.recruitment_candidate_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.recruitment_pipeline_stages(id) ON DELETE CASCADE,
  entered_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed', 'skipped')),
  moved_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_candidate_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view candidate stages in their org"
  ON public.recruitment_candidate_stages FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage candidate stages"
  ON public.recruitment_candidate_stages FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 5: recruitment_interviews
-- ====================================
CREATE TABLE public.recruitment_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES public.users(id),
  interview_type interview_type NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  phone_number TEXT,
  google_event_id TEXT,
  status interview_status NOT NULL DEFAULT 'scheduled',
  scheduled_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interviews in their org"
  ON public.recruitment_interviews FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage interviews"
  ON public.recruitment_interviews FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Interviewers can view their interviews"
  ON public.recruitment_interviews FOR SELECT
  USING (
    organization_id = get_current_user_organization_id() AND
    interviewer_id = auth.uid()
  );

-- ====================================
-- TABLE 6: recruitment_interview_feedback
-- ====================================
CREATE TABLE public.recruitment_interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL REFERENCES public.recruitment_interviews(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT[],
  concerns TEXT[],
  cultural_fit_score INTEGER CHECK (cultural_fit_score >= 1 AND cultural_fit_score <= 5),
  technical_skills_score INTEGER CHECK (technical_skills_score >= 1 AND technical_skills_score <= 5),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  recommendation feedback_recommendation NOT NULL,
  private_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_interview_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback in their org"
  ON public.recruitment_interview_feedback FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Interviewers can submit their feedback"
  ON public.recruitment_interview_feedback FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    interviewer_id = auth.uid()
  );

CREATE POLICY "Managers can manage feedback"
  ON public.recruitment_interview_feedback FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 7: recruitment_references
-- ====================================
CREATE TABLE public.recruitment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  reference_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  company TEXT,
  phone_number TEXT NOT NULL,
  email TEXT,
  call_status call_status NOT NULL DEFAULT 'not_called',
  called_by UUID REFERENCES public.users(id),
  call_date TIMESTAMP WITH TIME ZONE,
  call_duration_minutes INTEGER,
  reference_feedback TEXT,
  overall_rating reference_rating,
  would_rehire BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view references in their org"
  ON public.recruitment_references FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage references"
  ON public.recruitment_references FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 8: recruitment_notes
-- ====================================
CREATE TABLE public.recruitment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  note_content TEXT NOT NULL,
  note_type note_type NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their org"
  ON public.recruitment_notes FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create notes"
  ON public.recruitment_notes FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own notes"
  ON public.recruitment_notes FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own notes"
  ON public.recruitment_notes FOR DELETE
  USING (
    organization_id = get_current_user_organization_id() AND
    user_id = auth.uid()
  );

-- ====================================
-- TABLE 9: recruitment_documents
-- ====================================
CREATE TABLE public.recruitment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their org"
  ON public.recruitment_documents FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage documents"
  ON public.recruitment_documents FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- ====================================
-- TABLE 10: recruitment_manager_approvals
-- ====================================
CREATE TABLE public.recruitment_manager_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.users(id),
  requested_by UUID REFERENCES public.users(id),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decision approval_decision,
  decision_at TIMESTAMP WITH TIME ZONE,
  decision_notes TEXT,
  additional_interview_requested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_manager_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals in their org"
  ON public.recruitment_manager_approvals FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create approval requests"
  ON public.recruitment_manager_approvals FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can update their approval decisions"
  ON public.recruitment_manager_approvals FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    manager_id = auth.uid()
  );

-- ====================================
-- TABLE 11: recruitment_stage_transitions
-- ====================================
CREATE TABLE public.recruitment_stage_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.recruitment_pipeline_stages(id),
  to_stage_id UUID NOT NULL REFERENCES public.recruitment_pipeline_stages(id),
  moved_by UUID REFERENCES public.users(id),
  transition_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  automated BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.recruitment_stage_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transitions in their org"
  ON public.recruitment_stage_transitions FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create transitions"
  ON public.recruitment_stage_transitions FOR INSERT
  WITH CHECK (organization_id = get_current_user_organization_id());

-- ====================================
-- TABLE 12: recruitment_email_log
-- ====================================
CREATE TABLE public.recruitment_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  email_type email_type NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resend_email_id TEXT,
  status email_status NOT NULL DEFAULT 'sent',
  error_message TEXT
);

ALTER TABLE public.recruitment_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view email logs"
  ON public.recruitment_email_log FOR SELECT
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "System can create email logs"
  ON public.recruitment_email_log FOR INSERT
  WITH CHECK (organization_id = get_current_user_organization_id());

-- ====================================
-- INSERT DEFAULT PIPELINE STAGES
-- ====================================
-- This will be inserted for each organization when they enable recruitment

-- ====================================
-- HELPER FUNCTIONS
-- ====================================

-- Function to get days in current stage
CREATE OR REPLACE FUNCTION get_days_in_current_stage(p_candidate_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  days_count INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - entered_date))::INTEGER
  INTO days_count
  FROM public.recruitment_candidate_stages
  WHERE candidate_id = p_candidate_id
    AND completed_date IS NULL
  ORDER BY entered_date DESC
  LIMIT 1;
  
  RETURN COALESCE(days_count, 0);
END;
$$;

-- Function to check if reference check threshold is met
CREATE OR REPLACE FUNCTION check_reference_threshold(p_candidate_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  answered_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE call_status = 'answered'),
    COUNT(*)
  INTO answered_count, total_count
  FROM public.recruitment_references
  WHERE candidate_id = p_candidate_id;
  
  -- Require at least 2 answered out of minimum 3 references
  RETURN answered_count >= 2 AND total_count >= 3;
END;
$$;

-- Function to calculate average interview rating
CREATE OR REPLACE FUNCTION get_candidate_average_rating(p_candidate_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2)
  INTO avg_rating
  FROM public.recruitment_interview_feedback
  WHERE candidate_id = p_candidate_id;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$;

-- ====================================
-- TRIGGERS
-- ====================================

-- Update candidate overall_rating when feedback is submitted
CREATE OR REPLACE FUNCTION update_candidate_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.recruitment_candidates
  SET overall_rating = get_candidate_average_rating(NEW.candidate_id),
      updated_at = NOW()
  WHERE id = NEW.candidate_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_candidate_rating
  AFTER INSERT ON public.recruitment_interview_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_rating();

-- Create stage transition record when candidate stage changes
CREATE OR REPLACE FUNCTION log_stage_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
    INSERT INTO public.recruitment_stage_transitions (
      organization_id,
      candidate_id,
      from_stage_id,
      to_stage_id,
      moved_by,
      automated
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      OLD.current_stage_id,
      NEW.current_stage_id,
      auth.uid(),
      false
    );
    
    -- Update current stage in candidate_stages
    IF OLD.current_stage_id IS NOT NULL THEN
      UPDATE public.recruitment_candidate_stages
      SET completed_date = NOW(),
          status = 'passed'
      WHERE candidate_id = NEW.id
        AND stage_id = OLD.current_stage_id
        AND completed_date IS NULL;
    END IF;
    
    -- Create new stage entry
    INSERT INTO public.recruitment_candidate_stages (
      organization_id,
      candidate_id,
      stage_id,
      moved_by
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.current_stage_id,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_stage_transition
  AFTER UPDATE ON public.recruitment_candidates
  FOR EACH ROW
  WHEN (OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id)
  EXECUTE FUNCTION log_stage_transition();

-- Update timestamps
CREATE TRIGGER trigger_update_recruitment_positions_timestamp
  BEFORE UPDATE ON public.recruitment_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_recruitment_candidates_timestamp
  BEFORE UPDATE ON public.recruitment_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_recruitment_interviews_timestamp
  BEFORE UPDATE ON public.recruitment_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_recruitment_references_timestamp
  BEFORE UPDATE ON public.recruitment_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_recruitment_notes_timestamp
  BEFORE UPDATE ON public.recruitment_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_recruitment_pipeline_stages_timestamp
  BEFORE UPDATE ON public.recruitment_pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_recruitment_manager_approvals_timestamp
  BEFORE UPDATE ON public.recruitment_manager_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX idx_recruitment_candidates_org_status ON public.recruitment_candidates(organization_id, status);
CREATE INDEX idx_recruitment_candidates_stage ON public.recruitment_candidates(current_stage_id);
CREATE INDEX idx_recruitment_candidates_position ON public.recruitment_candidates(position_id);
CREATE INDEX idx_recruitment_interviews_candidate ON public.recruitment_interviews(candidate_id);
CREATE INDEX idx_recruitment_interviews_interviewer ON public.recruitment_interviews(interviewer_id);
CREATE INDEX idx_recruitment_interviews_scheduled_date ON public.recruitment_interviews(scheduled_date);
CREATE INDEX idx_recruitment_feedback_candidate ON public.recruitment_interview_feedback(candidate_id);
CREATE INDEX idx_recruitment_references_candidate ON public.recruitment_references(candidate_id);
CREATE INDEX idx_recruitment_notes_candidate ON public.recruitment_notes(candidate_id);
CREATE INDEX idx_recruitment_stage_transitions_candidate ON public.recruitment_stage_transitions(candidate_id);
CREATE INDEX idx_recruitment_candidate_stages_candidate ON public.recruitment_candidate_stages(candidate_id);

-- ====================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================
COMMENT ON TABLE public.recruitment_positions IS 'Job postings and open positions';
COMMENT ON TABLE public.recruitment_candidates IS 'Candidate master records';
COMMENT ON TABLE public.recruitment_pipeline_stages IS 'Configurable recruitment pipeline stages per organization';
COMMENT ON TABLE public.recruitment_candidate_stages IS 'Track candidate progress through pipeline stages';
COMMENT ON TABLE public.recruitment_interviews IS 'Schedule and track interviews';
COMMENT ON TABLE public.recruitment_interview_feedback IS 'Interview feedback and ratings';
COMMENT ON TABLE public.recruitment_references IS 'Reference checks and call logs';
COMMENT ON TABLE public.recruitment_notes IS 'Internal notes on candidates';
COMMENT ON TABLE public.recruitment_documents IS 'Resumes, cover letters, and other candidate documents';
COMMENT ON TABLE public.recruitment_manager_approvals IS 'Manager approval workflow tracking';
COMMENT ON TABLE public.recruitment_stage_transitions IS 'Audit log of all stage changes';
COMMENT ON TABLE public.recruitment_email_log IS 'Log of all emails sent to candidates and staff';