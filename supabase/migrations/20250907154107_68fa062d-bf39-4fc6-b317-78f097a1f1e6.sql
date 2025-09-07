-- Fix data integrity issues while properly handling audit trail
-- Use a system user approach for the cleanup

-- First get a superadmin user ID to use for system operations
DO $$
DECLARE
    system_user_id uuid;
    orphaned_count integer;
    cleaned_count integer;
BEGIN
    -- Get the first superadmin user as system user
    SELECT id INTO system_user_id 
    FROM users 
    WHERE role = 'superadmin' 
    LIMIT 1;
    
    IF system_user_id IS NULL THEN
        -- If no superadmin, get any admin
        SELECT id INTO system_user_id 
        FROM users 
        WHERE role = 'admin' 
        LIMIT 1;
    END IF;
    
    -- Count orphaned quiz assignments
    SELECT COUNT(*) INTO orphaned_count
    FROM training_assignments ta 
    LEFT JOIN quizzes q ON ta.content_id = q.id
    WHERE ta.assignment_type = 'quiz' AND q.id IS NULL;
    
    RAISE NOTICE 'Found % orphaned quiz assignments', orphaned_count;
    
    IF orphaned_count > 0 THEN
        -- Temporarily set a user context for the audit trigger
        PERFORM set_config('request.jwt.claims', json_build_object('sub', system_user_id)::text, true);
        
        -- Update orphaned assignments to completed status
        UPDATE training_assignments 
        SET 
            status = 'completed',
            notes = COALESCE(notes, '') || ' [System: Referenced quiz no longer exists - auto-completed ' || now() || ']',
            completed_at = NOW()
        WHERE assignment_type = 'quiz' 
        AND content_id NOT IN (SELECT id FROM quizzes)
        AND status IN ('pending', 'in_progress');
        
        GET DIAGNOSTICS cleaned_count = ROW_COUNT;
        RAISE NOTICE 'Updated % orphaned assignments to completed status', cleaned_count;
        
        -- Clean up the session config
        PERFORM set_config('request.jwt.claims', NULL, true);
    END IF;
    
    -- Clean up orphaned quiz attempts (these don't have audit triggers)
    DELETE FROM quiz_attempts 
    WHERE quiz_id NOT IN (SELECT id FROM quizzes);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RAISE NOTICE 'Removed % orphaned quiz attempts', cleaned_count;
    
END $$;