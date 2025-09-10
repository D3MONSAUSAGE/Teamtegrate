-- Create safe delete function for training assignments that handles dependencies
CREATE OR REPLACE FUNCTION public.delete_training_assignment_safe(assignment_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  affected_rows integer := 0;
  org_id uuid;
BEGIN
  -- Get organization for authorization check
  SELECT organization_id INTO org_id 
  FROM public.training_assignments 
  WHERE id = assignment_id_param;
  
  IF org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Assignment not found'
    );
  END IF;
  
  -- Verify user has access to this organization
  IF org_id != public.get_current_user_organization_id() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied'
    );
  END IF;
  
  -- Handle dependencies in order
  BEGIN
    -- 1. Update any assignments that reference this one via reassigned_from (set to NULL)
    UPDATE public.training_assignments 
    SET reassigned_from = NULL 
    WHERE reassigned_from = assignment_id_param;
    
    -- 2. Delete audit records (CASCADE should handle this, but let's be explicit)
    DELETE FROM public.training_assignment_audit 
    WHERE assignment_id = assignment_id_param;
    
    -- 3. Update any retraining assignments that reference this as original
    UPDATE public.training_assignments 
    SET original_assignment_id = NULL 
    WHERE original_assignment_id = assignment_id_param;
    
    -- 4. Finally delete the main assignment
    DELETE FROM public.training_assignments 
    WHERE id = assignment_id_param;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Assignment not found or already deleted'
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Assignment deleted successfully',
      'deleted_count', affected_rows
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete assignment: ' || SQLERRM
    );
  END;
END;
$$;