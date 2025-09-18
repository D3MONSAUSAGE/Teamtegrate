-- Create admin function to update user roles with service_role privileges
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
  
  -- Update the role directly (bypasses the trigger since this is SECURITY DEFINER)
  UPDATE public.users 
  SET role = new_role 
  WHERE id = target_user_id;
  
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

-- Create function to sync user profile across all tables
CREATE OR REPLACE FUNCTION public.sync_user_profile_across_tables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if name or email changed and it's not a protected field update
  IF TG_OP = 'UPDATE' AND (
    NEW.name IS DISTINCT FROM OLD.name OR 
    NEW.email IS DISTINCT FROM OLD.email
  ) THEN
    
    -- Update tasks table where user_id matches
    UPDATE public.tasks 
    SET user_name = NEW.name
    WHERE user_id = NEW.id::text;
    
    -- Update comments table
    UPDATE public.comments 
    SET user_name = NEW.name
    WHERE user_id = NEW.id;
    
    -- Update project team members
    UPDATE public.project_team_members 
    SET user_name = NEW.name
    WHERE user_id = NEW.id;
    
    -- Update meeting requests
    UPDATE public.meeting_requests 
    SET organizer_name = NEW.name
    WHERE organizer_id = NEW.id;
    
    -- Update chat messages (if user_name field exists)
    UPDATE public.chat_messages 
    SET user_name = NEW.name
    WHERE user_id = NEW.id AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'chat_messages' 
      AND column_name = 'user_name'
    );
    
    -- Update time entries
    UPDATE public.time_entries 
    SET user_name = NEW.name
    WHERE user_id = NEW.id AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_entries' 
      AND column_name = 'user_name'
    );
    
    -- Update notifications
    UPDATE public.notifications 
    SET user_name = NEW.name
    WHERE user_id = NEW.id AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'user_name'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for user profile sync
DROP TRIGGER IF EXISTS trg_sync_user_profile ON public.users;
CREATE TRIGGER trg_sync_user_profile
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_profile_across_tables();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;