-- Update the trigger function to allow SECURITY DEFINER functions to bypass restrictions
CREATE OR REPLACE FUNCTION public.prevent_privileged_user_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.role IS DISTINCT FROM OLD.role)
       OR (NEW.organization_id IS DISTINCT FROM OLD.organization_id)
       OR (NEW.email IS DISTINCT FROM OLD.email) THEN
      
      -- Allow updates from service_role or from within SECURITY DEFINER functions
      -- Check if this is being called from a trusted context
      IF COALESCE((auth.jwt() ->> 'role'), '') = 'service_role' THEN
        -- Service role can always update
        RETURN NEW;
      END IF;
      
      -- Check if we're in a SECURITY DEFINER function context by looking at the call stack
      -- If we find our admin function in the call stack, allow the update
      IF EXISTS (
        SELECT 1 FROM pg_stat_activity 
        WHERE pid = pg_backend_pid() 
        AND query LIKE '%admin_update_user_role%'
      ) OR current_setting('application_name', true) = 'admin_function' THEN
        -- Allow the update from admin function
        RETURN NEW;
      END IF;
      
      -- Block client updates to protected fields
      RAISE EXCEPTION 'Changing protected fields (role, organization_id, email) is not allowed from client';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the admin function to set application_name for identification
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID, 
  new_role TEXT
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
  result JSONB;
  old_app_name TEXT;
BEGIN
  -- Get current user's role and organization
  SELECT role, organization_id INTO current_user_role, current_user_org
  FROM public.users 
  WHERE id = auth.uid();
  
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
  
  -- Log the action for audit
  INSERT INTO public.admin_access_audit (
    admin_user_id, 
    target_user_id, 
    organization_id, 
    access_type
  ) VALUES (
    auth.uid(), 
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