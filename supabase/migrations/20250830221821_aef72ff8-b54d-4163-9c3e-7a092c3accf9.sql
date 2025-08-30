-- Create RPC function to validate role changes with proper permissions
CREATE OR REPLACE FUNCTION public.can_change_user_role(
  manager_user_id uuid,
  target_user_id uuid, 
  new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  manager_record RECORD;
  target_record RECORD;
  result jsonb;
BEGIN
  -- Get manager details
  SELECT role, organization_id INTO manager_record
  FROM public.users 
  WHERE id = manager_user_id;
  
  -- Get target user details
  SELECT role, organization_id INTO target_record
  FROM public.users 
  WHERE id = target_user_id;
  
  -- Check if both users exist and are in same organization
  IF manager_record.organization_id IS NULL OR target_record.organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'One or both users not found'
    );
  END IF;
  
  IF manager_record.organization_id != target_record.organization_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Users are not in the same organization'
    );
  END IF;
  
  -- Cannot change own role
  IF manager_user_id = target_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Cannot change your own role'
    );
  END IF;
  
  -- Role hierarchy validation
  -- Superadmin can change anyone's role (except their own)
  IF manager_record.role = 'superadmin' THEN
    -- If promoting someone to superadmin, it requires a transfer
    IF new_role = 'superadmin' THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'requires_transfer', true,
        'reason', 'Promoting to superadmin requires role transfer'
      );
    ELSE
      RETURN jsonb_build_object('allowed', true);
    END IF;
  END IF;
  
  -- Admin can only manage managers and users (not superadmins or other admins)
  IF manager_record.role = 'admin' THEN
    -- Cannot manage superadmins or other admins
    IF target_record.role IN ('superadmin', 'admin') THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Admins cannot manage superadmins or other admins'
      );
    END IF;
    
    -- Cannot promote to superadmin or admin
    IF new_role IN ('superadmin', 'admin') THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Admins cannot promote users to admin or superadmin roles'
      );
    END IF;
    
    -- Can manage managers and users, assign manager and user roles
    IF target_record.role IN ('manager', 'user') AND new_role IN ('manager', 'user') THEN
      RETURN jsonb_build_object('allowed', true);
    END IF;
  END IF;
  
  -- Manager can only manage users (not managers, admins, or superadmins)
  IF manager_record.role = 'manager' THEN
    -- Cannot manage anyone except users
    IF target_record.role != 'user' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Managers can only manage users'
      );
    END IF;
    
    -- Cannot promote users beyond user role
    IF new_role != 'user' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Managers cannot change user roles'
      );
    END IF;
    
    RETURN jsonb_build_object('allowed', true);
  END IF;
  
  -- Regular users cannot change any roles
  RETURN jsonb_build_object(
    'allowed', false,
    'reason', 'Insufficient permissions to change user roles'
  );
END;
$$;