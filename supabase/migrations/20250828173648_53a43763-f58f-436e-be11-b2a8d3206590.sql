-- Create training courses table
CREATE TABLE public.training_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_duration_minutes INTEGER,
  tags TEXT[],
  thumbnail_url TEXT
);

-- Create training modules table
CREATE TABLE public.training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  module_order INTEGER NOT NULL,
  content_type TEXT CHECK (content_type IN ('video', 'text', 'quiz', 'mixed')) NOT NULL,
  youtube_video_id TEXT,
  text_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')) NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  explanation TEXT,
  question_order INTEGER NOT NULL
);

-- Create user training progress table
CREATE TABLE public.user_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  module_id UUID,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')) DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  attempt_number INTEGER NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_courses
CREATE POLICY "Users can view courses in their organization" 
ON public.training_courses FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins can manage courses" 
ON public.training_courses FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- RLS Policies for training_modules
CREATE POLICY "Users can view modules in their organization courses" 
ON public.training_modules FOR SELECT 
USING (
  course_id IN (
    SELECT id FROM training_courses 
    WHERE organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Admins can manage modules" 
ON public.training_modules FOR ALL 
USING (
  course_id IN (
    SELECT id FROM training_courses 
    WHERE organization_id = get_current_user_organization_id()
  ) AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- RLS Policies for quizzes
CREATE POLICY "Users can view quizzes in their organization" 
ON public.quizzes FOR SELECT 
USING (
  module_id IN (
    SELECT tm.id FROM training_modules tm
    JOIN training_courses tc ON tm.course_id = tc.id
    WHERE tc.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Admins can manage quizzes" 
ON public.quizzes FOR ALL 
USING (
  module_id IN (
    SELECT tm.id FROM training_modules tm
    JOIN training_courses tc ON tm.course_id = tc.id
    WHERE tc.organization_id = get_current_user_organization_id()
  ) AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- RLS Policies for quiz_questions
CREATE POLICY "Users can view questions in their organization" 
ON public.quiz_questions FOR SELECT 
USING (
  quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN training_modules tm ON q.module_id = tm.id
    JOIN training_courses tc ON tm.course_id = tc.id
    WHERE tc.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Admins can manage questions" 
ON public.quiz_questions FOR ALL 
USING (
  quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN training_modules tm ON q.module_id = tm.id
    JOIN training_courses tc ON tm.course_id = tc.id
    WHERE tc.organization_id = get_current_user_organization_id()
  ) AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- RLS Policies for user_training_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_training_progress FOR SELECT 
USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own progress" 
ON public.user_training_progress FOR UPDATE 
USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can insert their own progress" 
ON public.user_training_progress FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Admins can view all progress in organization" 
ON public.user_training_progress FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can create their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Admins can view all attempts in organization" 
ON public.quiz_attempts FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- Add foreign key constraints
ALTER TABLE public.training_modules 
ADD CONSTRAINT fk_training_modules_course 
FOREIGN KEY (course_id) REFERENCES public.training_courses(id) ON DELETE CASCADE;

ALTER TABLE public.quizzes 
ADD CONSTRAINT fk_quizzes_module 
FOREIGN KEY (module_id) REFERENCES public.training_modules(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_questions 
ADD CONSTRAINT fk_quiz_questions_quiz 
FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- Add triggers for updated_at
CREATE TRIGGER update_training_courses_updated_at
BEFORE UPDATE ON public.training_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_modules_updated_at
BEFORE UPDATE ON public.training_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_training_courses_org_id ON public.training_courses(organization_id);
CREATE INDEX idx_training_modules_course_id ON public.training_modules(course_id);
CREATE INDEX idx_quizzes_module_id ON public.quizzes(module_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_user_progress_user_course ON public.user_training_progress(user_id, course_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);