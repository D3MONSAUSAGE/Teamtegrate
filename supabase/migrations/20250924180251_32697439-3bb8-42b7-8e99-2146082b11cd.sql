-- Create an admin function to update user email safely
CREATE OR REPLACE FUNCTION admin_update_user_email(target_user_id uuid, new_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role TEXT;
  current_user_org UUID;
  target_user_org UUID;
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
      'error', 'Only admins can update user emails'
    );
  END IF;
  
  -- Get target user's organization
  SELECT organization_id INTO target_user_org
  FROM public.users 
  WHERE id = target_user_id;
  
  -- Verify both users are in the same organization
  IF current_user_org != target_user_org THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Users must be in the same organization'
    );
  END IF;
  
  -- Set application name to identify this as admin function
  old_app_name := current_setting('application_name', true);
  PERFORM set_config('application_name', 'admin_email_update', true);
  
  -- Update the email directly
  UPDATE public.users 
  SET email = new_email 
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
    'email_update_to_' || new_email
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Email updated successfully',
    'new_email', new_email
  );
END;
$$;