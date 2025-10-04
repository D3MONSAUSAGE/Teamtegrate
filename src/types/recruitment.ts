// Recruitment/ATS System Type Definitions

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary';
export type PositionStatus = 'open' | 'closed' | 'on_hold';
export type CandidateStatus = 'active' | 'hired' | 'rejected' | 'withdrawn';
export type CandidateSource = 'indeed' | 'linkedin' | 'referral' | 'direct' | 'other';
export type InterviewType = 'phone' | 'in_person' | 'video' | 'technical' | 'panel';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type FeedbackRecommendation = 'proceed' | 'reject' | 'unsure';
export type CallStatus = 'not_called' | 'answered' | 'voicemail' | 'no_answer' | 'invalid_number';
export type ReferenceRating = 'positive' | 'neutral' | 'negative';
export type NoteType = 'general' | 'interview_feedback' | 'red_flag' | 'strength' | 'question';
export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'reference_letter' | 'other';
export type ApprovalDecision = 'approved' | 'rejected' | 'more_info_needed';
export type EmailType = 'interview_invitation' | 'interview_reminder' | 'interview_reschedule' | 'rejection' | 'offer' | 'welcome';
export type EmailStatus = 'sent' | 'failed' | 'bounced';
export type StageType = 'applied' | 'screening' | 'interview' | 'assessment' | 'approval' | 'offer' | 'hired' | 'rejected';

export interface RecruitmentPipelineStage {
  id: string;
  organization_id: string;
  stage_name: string;
  stage_order: number;
  stage_type: StageType;
  color_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentPosition {
  id: string;
  organization_id: string;
  job_title: string;
  department?: string;
  location?: string;
  employment_type: EmploymentType;
  job_description?: string;
  requirements?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  status: PositionStatus;
  posted_date: string;
  target_hire_date?: string;
  hiring_manager_id?: string;
  hr_recruiter_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentCandidate {
  id: string;
  organization_id: string;
  position_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter_url?: string;
  source: CandidateSource;
  source_details?: string;
  current_stage_id?: string;
  overall_rating?: number;
  applied_date: string;
  status: CandidateStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentCandidateStage {
  id: string;
  organization_id: string;
  candidate_id: string;
  stage_id: string;
  entered_date: string;
  completed_date?: string;
  status: 'in_progress' | 'passed' | 'failed' | 'skipped';
  moved_by?: string;
  notes?: string;
  created_at: string;
}

export interface RecruitmentInterview {
  id: string;
  organization_id: string;
  candidate_id: string;
  interviewer_id: string;
  interview_type: InterviewType;
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  phone_number?: string;
  google_event_id?: string;
  status: InterviewStatus;
  scheduled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentInterviewFeedback {
  id: string;
  organization_id: string;
  interview_id: string;
  candidate_id: string;
  interviewer_id: string;
  rating: number;
  strengths?: string[];
  concerns?: string[];
  cultural_fit_score?: number;
  technical_skills_score?: number;
  communication_score?: number;
  recommendation: FeedbackRecommendation;
  private_notes?: string;
  submitted_at: string;
  created_at: string;
}

export interface RecruitmentReference {
  id: string;
  organization_id: string;
  candidate_id: string;
  reference_name: string;
  relationship: string;
  company?: string;
  phone_number: string;
  email?: string;
  call_status: CallStatus;
  called_by?: string;
  call_date?: string;
  call_duration_minutes?: number;
  reference_feedback?: string;
  overall_rating?: ReferenceRating;
  would_rehire?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentNote {
  id: string;
  organization_id: string;
  candidate_id: string;
  user_id: string;
  note_content: string;
  note_type: NoteType;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentDocument {
  id: string;
  organization_id: string;
  candidate_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface RecruitmentManagerApproval {
  id: string;
  organization_id: string;
  candidate_id: string;
  manager_id: string;
  requested_by?: string;
  requested_at: string;
  decision?: ApprovalDecision;
  decision_at?: string;
  decision_notes?: string;
  additional_interview_requested: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentStageTransition {
  id: string;
  organization_id: string;
  candidate_id: string;
  from_stage_id?: string;
  to_stage_id: string;
  moved_by?: string;
  transition_date: string;
  reason?: string;
  automated: boolean;
}

export interface RecruitmentEmailLog {
  id: string;
  organization_id: string;
  candidate_id?: string;
  email_type: EmailType;
  recipient_email: string;
  sent_at: string;
  resend_email_id?: string;
  status: EmailStatus;
  error_message?: string;
}

// Extended candidate with related data
export interface CandidateWithDetails extends RecruitmentCandidate {
  position?: RecruitmentPosition;
  current_stage?: RecruitmentPipelineStage;
  interviews?: RecruitmentInterview[];
  references?: RecruitmentReference[];
  notes?: RecruitmentNote[];
  documents?: RecruitmentDocument[];
  stage_history?: RecruitmentCandidateStage[];
  transitions?: RecruitmentStageTransition[];
  days_in_stage?: number;
}
