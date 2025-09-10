-- Create function to safely clean up orphaned training assignments
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_training_assignments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  orphaned_count INTEGER := 0;
  user_org_id UUID;
  user_role TEXT;
  result JSONB;
BEGIN
  -- Get user's organization and role
  SELECT organization_id, role INTO user_org_id, user_role
  FROM public.users 
  WHERE id = auth.uid();
  
  IF user_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found or not authenticated');
  END IF;
  
  -- Only allow managers and admins to run cleanup
  IF user_role NOT IN ('manager', 'admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Create a temp table with orphaned assignments for this organization
  CREATE TEMP TABLE temp_orphaned_assignments AS
  SELECT ta.id
  FROM training_assignments ta
  LEFT JOIN compliance_training_templates ctt ON ta.assignment_type = 'compliance_training' AND ta.content_id = ctt.id
  LEFT JOIN quizzes q ON ta.assignment_type = 'quiz' AND ta.content_id = q.id  
  LEFT JOIN training_courses tc ON ta.assignment_type = 'course' AND ta.content_id = tc.id
  WHERE ta.organization_id = user_org_id
    AND ta.assignment_type IN ('compliance_training', 'quiz', 'course')
    AND (
      (ta.assignment_type = 'compliance_training' AND ctt.id IS NULL) OR
      (ta.assignment_type = 'quiz' AND q.id IS NULL) OR
      (ta.assignment_type = 'course' AND tc.id IS NULL)
    );
  
  -- Get count of orphaned assignments
  SELECT COUNT(*) INTO orphaned_count FROM temp_orphaned_assignments;
  
  -- Clean up related data first
  -- 1. Clean up training assignment audit records
  DELETE FROM training_assignment_audit 
  WHERE assignment_id IN (SELECT id FROM temp_orphaned_assignments);
  
  -- 2. Clean up any certificate uploads
  DELETE FROM certificate_uploads 
  WHERE assignment_id IN (SELECT id FROM temp_orphaned_assignments);
  
  -- 3. Clean up compliance records that reference orphaned assignments
  DELETE FROM compliance_training_records
  WHERE id IN (
    SELECT ctr.id 
    FROM compliance_training_records ctr
    JOIN temp_orphaned_assignments toa ON ctr.template_id::text IN (
      SELECT ta.content_id 
      FROM training_assignments ta 
      WHERE ta.id = toa.id AND ta.assignment_type = 'compliance_training'
    )
  );
  
  -- 4. Finally, delete the orphaned assignments themselves
  DELETE FROM training_assignments 
  WHERE id IN (SELECT id FROM temp_orphaned_assignments);
  
  -- Drop temp table
  DROP TABLE temp_orphaned_assignments;
  
  -- Log the cleanup action
  INSERT INTO admin_access_audit (admin_user_id, target_user_id, organization_id, access_type)
  VALUES (auth.uid(), null, user_org_id, 'cleanup_orphaned_assignments');
  
  result := jsonb_build_object(
    'success', true,
    'orphaned_assignments_cleaned', orphaned_count,
    'organization_id', user_org_id,
    'cleaned_by', auth.uid()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Cleanup temp table if it exists
  DROP TABLE IF EXISTS temp_orphaned_assignments;
  
  RETURN jsonb_build_object(
    'success', false, 
    'error', 'Cleanup failed: ' || SQLERRM
  );
END;
$$;

-- Add foreign key constraints to prevent future orphaned assignments
-- Note: We'll add these as NOT VALID first to avoid issues with existing data
DO $$
BEGIN
  -- Add foreign key for compliance training templates (if it doesn't exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_training_assignments_compliance_template'
  ) THEN
    -- We can't add a direct FK constraint because content_id is text and references different tables
    -- Instead, we'll add a trigger to validate references
    NULL;
  END IF;
END $$;

-- Create a trigger to prevent orphaned assignments in the future
CREATE OR REPLACE FUNCTION public.validate_training_assignment_references()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate that the content_id references an existing record
  IF NEW.assignment_type = 'compliance_training' THEN
    IF NOT EXISTS (SELECT 1 FROM compliance_training_templates WHERE id = NEW.content_id::uuid) THEN
      RAISE EXCEPTION 'Referenced compliance training template does not exist: %', NEW.content_id;
    END IF;
  ELSIF NEW.assignment_type = 'quiz' THEN
    IF NOT EXISTS (SELECT 1 FROM quizzes WHERE id = NEW.content_id::uuid) THEN
      RAISE EXCEPTION 'Referenced quiz does not exist: %', NEW.content_id;
    END IF;
  ELSIF NEW.assignment_type = 'course' THEN
    IF NOT EXISTS (SELECT 1 FROM training_courses WHERE id = NEW.content_id::uuid) THEN
      RAISE EXCEPTION 'Referenced training course does not exist: %', NEW.content_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for inserts and updates
DROP TRIGGER IF EXISTS validate_training_assignment_references_trigger ON training_assignments;
CREATE TRIGGER validate_training_assignment_references_trigger
  BEFORE INSERT OR UPDATE ON training_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_training_assignment_references();

-- Create function to get orphaned assignments count (for monitoring)
CREATE OR REPLACE FUNCTION public.get_orphaned_assignments_count()
RETURNS INTEGER
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  orphaned_count INTEGER := 0;
  user_org_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id
  FROM public.users 
  WHERE id = auth.uid();
  
  IF user_org_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO orphaned_count
  FROM training_assignments ta
  LEFT JOIN compliance_training_templates ctt ON ta.assignment_type = 'compliance_training' AND ta.content_id = ctt.id
  LEFT JOIN quizzes q ON ta.assignment_type = 'quiz' AND ta.content_id = q.id
  LEFT JOIN training_courses tc ON ta.assignment_type = 'course' AND ta.content_id = tc.id
  WHERE ta.organization_id = user_org_id
    AND ta.assignment_type IN ('compliance_training', 'quiz', 'course')
    AND (
      (ta.assignment_type = 'compliance_training' AND ctt.id IS NULL) OR
      (ta.assignment_type = 'quiz' AND q.id IS NULL) OR
      (ta.assignment_type = 'course' AND tc.id IS NULL)
    );
  
  RETURN orphaned_count;
END;
$$;