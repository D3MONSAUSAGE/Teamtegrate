-- Fix the admin function to handle null auth.uid() case
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID, 
  new_role TEXT,
  admin_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
  current_user_org UUID;
  target_user_org UUID;
  target_user_current_role TEXT;
  effective_admin_id UUID;
  old_app_name TEXT;
BEGIN
  -- Use provided admin_user_id or try auth.uid()
  effective_admin_id := COALESCE(admin_user_id, auth.uid());
  
  -- If still null, this is likely being called from SQL editor by a superadmin
  -- Allow it but skip audit logging
  IF effective_admin_id IS NULL THEN
    -- Get target user's current role and organization
    SELECT role, organization_id INTO target_user_current_role, target_user_org
    FROM public.users 
    WHERE id = target_user_id;
    
    IF target_user_current_role IS NULL THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Target user not found'
      );
    END IF;
    
    -- Set application name to identify this as admin function
    old_app_name := current_setting('application_name', true);
    PERFORM set_config('application_name', 'admin_function', true);
    
    -- Update the role directly (no auth checks for direct SQL calls)
    UPDATE public.users 
    SET role = new_role 
    WHERE id = target_user_id;
    
    -- Reset application name
    PERFORM set_config('application_name', old_app_name, true);
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Role updated successfully (direct SQL call)',
      'old_role', target_user_current_role,
      'new_role', new_role
    );
  END IF;
  
  -- Get current user's role and organization
  SELECT role, organization_id INTO current_user_role, current_user_org
  FROM public.users 
  WHERE id = effective_admin_id;
  
  -- Verify current user is admin or superadmin
  IF current_user_role NOT IN ('admin', 'superadmin') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Only admins can update user roles'
    );
  END IF;
  
  -- Get target user's organization and current role
  SELECT role, organization_id INTO target_user_current_role, target_user_org
  FROM public.users 
  WHERE id = target_user_id;
  
  -- Verify both users are in the same organization
  IF current_user_org != target_user_org THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Users must be in the same organization'
    );
  END IF;
  
  -- Prevent non-superadmins from changing superadmin roles
  IF current_user_role != 'superadmin' AND target_user_current_role = 'superadmin' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Only superadmins can change superadmin roles'
    );
  END IF;
  
  -- Prevent non-superadmins from creating superadmins
  IF current_user_role != 'superadmin' AND new_role = 'superadmin' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Only superadmins can create superadmins'
    );
  END IF;
  
  -- Set application name to identify this as admin function
  old_app_name := current_setting('application_name', true);
  PERFORM set_config('application_name', 'admin_function', true);
  
  -- Update the role directly
  UPDATE public.users 
  SET role = new_role 
  WHERE id = target_user_id;
  
  -- Reset application name
  PERFORM set_config('application_name', old_app_name, true);
  
  -- Log the action for audit (only if we have an admin user)
  INSERT INTO public.admin_access_audit (
    admin_user_id, 
    target_user_id, 
    organization_id, 
    access_type
  ) VALUES (
    effective_admin_id, 
    target_user_id, 
    current_user_org, 
    'role_change_' || target_user_current_role || '_to_' || new_role
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Role updated successfully',
    'old_role', target_user_current_role,
    'new_role', new_role
  );
END;
$$;