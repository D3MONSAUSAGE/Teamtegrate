-- First, let's clean up existing orphaned quiz attempts before adding constraints
-- Step 1: Identify and handle orphaned quiz attempts

-- Create a temporary table to store orphaned attempts for reference
CREATE TEMP TABLE temp_orphaned_attempts AS
SELECT qa.id as attempt_id, qa.quiz_id, qa.user_id, u.name as user_name, qa.score, qa.max_score
FROM quiz_attempts qa
JOIN users u ON qa.user_id = u.id
LEFT JOIN quizzes q ON qa.quiz_id = q.id
WHERE q.id IS NULL;

-- Log the count of orphaned attempts
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count FROM temp_orphaned_attempts;
    RAISE NOTICE 'Found % orphaned quiz attempts that will be cleaned up', orphaned_count;
END
$$;

-- Remove overrides for orphaned attempts first
DELETE FROM quiz_answer_overrides 
WHERE quiz_attempt_id IN (
    SELECT attempt_id FROM temp_orphaned_attempts
);

-- Remove the orphaned quiz attempts
DELETE FROM quiz_attempts 
WHERE id IN (
    SELECT attempt_id FROM temp_orphaned_attempts
);

-- Now we can safely add the foreign key constraints
ALTER TABLE quiz_attempts 
ADD CONSTRAINT fk_quiz_attempts_quiz_id 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for quiz_answer_overrides -> quiz_attempts
ALTER TABLE quiz_answer_overrides 
ADD CONSTRAINT fk_quiz_answer_overrides_attempt_id 
FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for quiz_answer_overrides -> quiz_questions
ALTER TABLE quiz_answer_overrides 
ADD CONSTRAINT fk_quiz_answer_overrides_question_id 
FOREIGN KEY (question_id) REFERENCES quiz_questions(id) 
ON DELETE CASCADE;