-- Create the missing can_change_user_role RPC function
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
  manager_user RECORD;
  target_user RECORD;
  current_superadmin RECORD;
  result jsonb;
BEGIN
  -- Get manager user details
  SELECT role, organization_id INTO manager_user
  FROM public.users 
  WHERE id = manager_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Manager user not found'
    );
  END IF;

  -- Get target user details
  SELECT role, organization_id, name INTO target_user
  FROM public.users 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Target user not found'
    );
  END IF;

  -- Check if both users are in the same organization
  IF manager_user.organization_id != target_user.organization_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Users must be in the same organization'
    );
  END IF;

  -- Prevent self-role changes
  IF manager_user_id = target_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Cannot change your own role'
    );
  END IF;

  -- Role hierarchy validation
  -- Superadmin can manage everyone except other superadmins (unless promoting to superadmin)
  IF manager_user.role = 'superadmin' THEN
    -- If trying to promote someone to superadmin, this requires a transfer
    IF new_role = 'superadmin' THEN
      -- Get current superadmin details
      SELECT id, name INTO current_superadmin
      FROM public.users 
      WHERE organization_id = manager_user.organization_id 
        AND role = 'superadmin' 
        AND id = manager_user_id;
        
      RETURN jsonb_build_object(
        'allowed', true,
        'requires_transfer', true,
        'current_superadmin_id', current_superadmin.id,
        'current_superadmin_name', current_superadmin.name
      );
    END IF;
    
    -- Superadmin can change any non-superadmin role
    IF target_user.role != 'superadmin' AND new_role != 'superadmin' THEN
      RETURN jsonb_build_object('allowed', true);
    END IF;
    
    -- Cannot demote other superadmins
    IF target_user.role = 'superadmin' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Cannot change role of another superadmin'
      );
    END IF;
  END IF;

  -- Admin can manage managers and users
  IF manager_user.role = 'admin' THEN
    IF target_user.role IN ('manager', 'user') AND new_role IN ('manager', 'user') THEN
      RETURN jsonb_build_object('allowed', true);
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Admins can only manage managers and regular users'
      );
    END IF;
  END IF;

  -- Manager can manage users only
  IF manager_user.role = 'manager' THEN
    IF target_user.role = 'user' AND new_role = 'user' THEN
      RETURN jsonb_build_object('allowed', true);
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Managers can only manage regular users'
      );
    END IF;
  END IF;

  -- Default: not allowed
  RETURN jsonb_build_object(
    'allowed', false,
    'reason', 'Insufficient permissions for this role change'
  );
END;
$$;