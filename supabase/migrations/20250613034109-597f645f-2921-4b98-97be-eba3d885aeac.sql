
-- Update the can_change_user_role function to enforce one superadmin per organization
CREATE OR REPLACE FUNCTION public.can_change_user_role(
  manager_user_id uuid,
  target_user_id uuid,
  new_role text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  manager_info RECORD;
  target_info RECORD;
  result JSONB;
  would_leave_without_superadmin BOOLEAN;
  existing_superadmin_count INTEGER;
  existing_superadmin_id UUID;
BEGIN
  -- Get manager information
  SELECT role, organization_id, email, name INTO manager_info
  FROM public.users
  WHERE id = manager_user_id;

  -- Get target user information  
  SELECT role, organization_id, email, name INTO target_info
  FROM public.users
  WHERE id = target_user_id;

  -- Check if users are in same organization
  IF manager_info.organization_id != target_info.organization_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Users must be in the same organization'
    );
  END IF;

  -- Prevent self-modification
  IF manager_user_id = target_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Cannot modify your own role'
    );
  END IF;

  -- Only superadmin can manage roles
  IF manager_info.role != 'superadmin' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Only superadmins can change user roles'
    );
  END IF;

  -- Check if demoting current superadmin would leave organization without one
  IF target_info.role = 'superadmin' AND new_role != 'superadmin' THEN
    SELECT public.would_leave_org_without_superadmin(target_user_id, target_info.organization_id) 
    INTO would_leave_without_superadmin;
    
    IF would_leave_without_superadmin THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Cannot demote the only superadmin. Promote another user to superadmin first.'
      );
    END IF;
  END IF;

  -- NEW: Check for one superadmin per organization rule
  IF new_role = 'superadmin' AND target_info.role != 'superadmin' THEN
    -- Count existing superadmins in the organization
    SELECT COUNT(*), MIN(id) INTO existing_superadmin_count, existing_superadmin_id
    FROM public.users
    WHERE organization_id = target_info.organization_id 
      AND role = 'superadmin'
      AND id != target_user_id;
    
    IF existing_superadmin_count > 0 THEN
      -- Get current superadmin info for transfer message
      RETURN jsonb_build_object(
        'allowed', true,
        'requires_transfer', true,
        'current_superadmin_id', existing_superadmin_id,
        'current_superadmin_name', (
          SELECT name FROM public.users WHERE id = existing_superadmin_id
        ),
        'reason', 'Promoting this user to superadmin will automatically demote the current superadmin to admin role.'
      );
    END IF;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'requires_transfer', false,
    'reason', null
  );
END;
$$;

-- Create function to handle superadmin transfers atomically
CREATE OR REPLACE FUNCTION public.transfer_superadmin_role(
  current_superadmin_id uuid,
  new_superadmin_id uuid,
  organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verify both users are in the same organization
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = current_superadmin_id 
    AND organization_id = transfer_superadmin_role.organization_id
    AND role = 'superadmin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Current superadmin not found or invalid'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = new_superadmin_id 
    AND organization_id = transfer_superadmin_role.organization_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user not found in organization'
    );
  END IF;

  -- Perform atomic transfer
  BEGIN
    -- Demote current superadmin to admin
    UPDATE public.users 
    SET role = 'admin' 
    WHERE id = current_superadmin_id;

    -- Promote new user to superadmin
    UPDATE public.users 
    SET role = 'superadmin' 
    WHERE id = new_superadmin_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Superadmin role transferred successfully'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to transfer superadmin role: ' || SQLERRM
    );
  END;
END;
$$;
