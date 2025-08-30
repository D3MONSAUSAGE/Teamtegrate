-- Add database constraints to ensure quiz quality

-- Add check to prevent quizzes from being created without a reasonable passing score
ALTER TABLE quizzes ADD CONSTRAINT check_reasonable_passing_score 
CHECK (passing_score >= 0 AND passing_score <= 100);

-- Add check to ensure max attempts is at least 1
ALTER TABLE quizzes ADD CONSTRAINT check_max_attempts_positive 
CHECK (max_attempts >= 1);

-- Add check to ensure time limit is reasonable if set
ALTER TABLE quizzes ADD CONSTRAINT check_reasonable_time_limit 
CHECK (time_limit_minutes IS NULL OR time_limit_minutes >= 1);

-- Add check to ensure quiz points are positive
ALTER TABLE quiz_questions ADD CONSTRAINT check_points_positive 
CHECK (points >= 1);

-- Add check to ensure question order is positive
ALTER TABLE quiz_questions ADD CONSTRAINT check_question_order_positive 
CHECK (question_order >= 1);

-- Create function to validate quiz has questions before allowing quiz attempts
CREATE OR REPLACE FUNCTION validate_quiz_has_questions()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the quiz has at least one question
    IF NOT EXISTS (
        SELECT 1 FROM quiz_questions 
        WHERE quiz_id = NEW.quiz_id
    ) THEN
        RAISE EXCEPTION 'Cannot start quiz attempt: Quiz has no questions configured';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate quiz has questions before allowing attempts
CREATE TRIGGER validate_quiz_questions_before_attempt
    BEFORE INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_has_questions();