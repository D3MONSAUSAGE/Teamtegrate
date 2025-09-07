-- Add foreign key constraints with CASCADE options for data integrity
-- This will prevent orphaned quiz attempts when quizzes are deleted

-- First, let's add a proper foreign key constraint for quiz_attempts -> quizzes
-- with CASCADE DELETE to automatically remove attempts when quizzes are deleted
ALTER TABLE quiz_attempts 
ADD CONSTRAINT fk_quiz_attempts_quiz_id 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for quiz_answer_overrides -> quiz_attempts
-- with CASCADE DELETE to remove overrides when attempts are deleted
ALTER TABLE quiz_answer_overrides 
ADD CONSTRAINT fk_quiz_answer_overrides_attempt_id 
FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for quiz_answer_overrides -> quiz_questions
-- with CASCADE DELETE to remove overrides when questions are deleted
ALTER TABLE quiz_answer_overrides 
ADD CONSTRAINT fk_quiz_answer_overrides_question_id 
FOREIGN KEY (question_id) REFERENCES quiz_questions(id) 
ON DELETE CASCADE;

-- Create a function to safely delete quizzes with proper cleanup
CREATE OR REPLACE FUNCTION safe_delete_quiz(quiz_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    attempts_count INTEGER;
    overrides_count INTEGER;
BEGIN
    -- Get counts before deletion
    SELECT COUNT(*) INTO attempts_count FROM quiz_attempts WHERE quiz_id = quiz_id_param;
    SELECT COUNT(*) INTO overrides_count FROM quiz_answer_overrides 
    WHERE quiz_attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = quiz_id_param);
    
    -- Delete the quiz (CASCADE will handle related records)
    DELETE FROM quizzes WHERE id = quiz_id_param;
    
    -- Return summary of what was deleted
    result := json_build_object(
        'quiz_id', quiz_id_param,
        'attempts_deleted', attempts_count,
        'overrides_deleted', overrides_count,
        'deleted_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to identify orphaned quiz attempts
CREATE OR REPLACE FUNCTION get_orphaned_quiz_attempts(organization_id_param UUID)
RETURNS TABLE (
    attempt_id UUID,
    quiz_id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    attempt_number INTEGER,
    score INTEGER,
    max_score INTEGER,
    passed BOOLEAN,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    answers_count INTEGER,
    has_overrides BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qa.id as attempt_id,
        qa.quiz_id,
        qa.user_id,
        u.name as user_name,
        u.email as user_email,
        qa.attempt_number,
        qa.score,
        qa.max_score,
        qa.passed,
        qa.started_at,
        qa.completed_at,
        COALESCE(array_length(qa.answers, 1), 0) as answers_count,
        EXISTS(SELECT 1 FROM quiz_answer_overrides qao WHERE qao.quiz_attempt_id = qa.id) as has_overrides
    FROM quiz_attempts qa
    JOIN users u ON qa.user_id = u.id
    LEFT JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.organization_id = organization_id_param
      AND q.id IS NULL  -- Quiz no longer exists
    ORDER BY qa.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an audit log for quiz deletions
CREATE TABLE IF NOT EXISTS quiz_deletion_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    quiz_id UUID NOT NULL,
    quiz_title TEXT,
    deleted_by UUID NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempts_affected INTEGER DEFAULT 0,
    overrides_affected INTEGER DEFAULT 0,
    deletion_reason TEXT,
    CONSTRAINT fk_quiz_deletion_audit_organization_id 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_deletion_audit_deleted_by 
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS on the audit table
ALTER TABLE quiz_deletion_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_deletion_audit
CREATE POLICY "Admins can view deletion audit in their organization" ON quiz_deletion_audit
    FOR SELECT USING (
        organization_id = get_current_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'manager')
        )
    );

CREATE POLICY "Admins can insert deletion audit" ON quiz_deletion_audit
    FOR INSERT WITH CHECK (
        organization_id = get_current_user_organization_id() AND
        deleted_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'manager')
        )
    );

-- Create a trigger to log quiz deletions
CREATE OR REPLACE FUNCTION log_quiz_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO quiz_deletion_audit (
        organization_id,
        quiz_id,
        quiz_title,
        deleted_by,
        attempts_affected,
        overrides_affected
    )
    SELECT 
        OLD.module_id,  -- We'll need to get org_id through module
        OLD.id,
        OLD.title,
        auth.uid(),
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = OLD.id),
        (SELECT COUNT(*) FROM quiz_answer_overrides qao 
         JOIN quiz_attempts qa ON qao.quiz_attempt_id = qa.id 
         WHERE qa.quiz_id = OLD.id)
    WHERE OLD.id IS NOT NULL;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We'll create the trigger after we verify the table structure
-- CREATE TRIGGER quiz_deletion_log_trigger
--     BEFORE DELETE ON quizzes
--     FOR EACH ROW
--     EXECUTE FUNCTION log_quiz_deletion();