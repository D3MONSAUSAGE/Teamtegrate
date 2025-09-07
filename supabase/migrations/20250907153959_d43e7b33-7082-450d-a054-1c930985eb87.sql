-- Fix any orphaned quiz assignments and ensure data integrity
-- First, let's check for orphaned assignments referencing non-existent quizzes
DO $$
DECLARE
    orphaned_count integer;
    cleaned_count integer;
BEGIN
    -- Count orphaned quiz assignments
    SELECT COUNT(*) INTO orphaned_count
    FROM training_assignments ta 
    LEFT JOIN quizzes q ON ta.content_id = q.id
    WHERE ta.assignment_type = 'quiz' AND q.id IS NULL;
    
    RAISE NOTICE 'Found % orphaned quiz assignments', orphaned_count;
    
    -- Update orphaned assignments to 'archived' status with explanatory notes
    UPDATE training_assignments 
    SET 
        status = 'completed', -- Mark as completed to prevent broken quiz attempts
        notes = COALESCE(notes, '') || ' [System: Referenced quiz no longer exists - marked as completed]',
        completed_at = NOW()
    WHERE assignment_type = 'quiz' 
    AND content_id NOT IN (SELECT id FROM quizzes)
    AND status IN ('pending', 'in_progress');
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RAISE NOTICE 'Updated % orphaned assignments to completed status', cleaned_count;
    
    -- Clean up any quiz attempts for non-existent quizzes
    DELETE FROM quiz_attempts 
    WHERE quiz_id NOT IN (SELECT id FROM quizzes);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RAISE NOTICE 'Removed % orphaned quiz attempts', cleaned_count;
END $$;