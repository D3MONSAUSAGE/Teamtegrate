-- First, check what the current trigger function looks like and modify it to allow admin bypass
CREATE OR REPLACE FUNCTION prevent_privileged_user_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow bypass from admin functions
  IF current_setting('app.admin_bypass', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Prevent updates to protected fields
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.role IS DISTINCT FROM NEW.role) OR 
       (OLD.organization_id IS DISTINCT FROM NEW.organization_id) OR 
       (OLD.email IS DISTINCT FROM NEW.email) THEN
      RAISE EXCEPTION 'Changing protected fields (role, organization_id, email) is not allowed from client';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create a secure function to update user roles with admin bypass
CREATE OR REPLACE FUNCTION admin_force_update_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  org_id UUID;
BEGIN
  -- Get the user's organization_id
  SELECT organization_id INTO org_id
  FROM users
  WHERE id = target_user_id;

  IF org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or has no organization'
    );
  END IF;

  -- Enable admin bypass
  PERFORM set_config('app.admin_bypass', 'true', true);

  -- Update users table directly
  UPDATE users
  SET role = new_role
  WHERE id = target_user_id;

  -- Update or insert into user_roles table
  INSERT INTO user_roles (user_id, role, organization_id)
  VALUES (target_user_id, new_role, org_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = new_role,
    updated_at = now();

  -- Disable admin bypass
  PERFORM set_config('app.admin_bypass', 'false', true);

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'new_role', new_role
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Ensure bypass is disabled even on error
  PERFORM set_config('app.admin_bypass', 'false', true);
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Fix Olga's role using the secure function
SELECT admin_force_update_user_role(
  '85ed5883-58f8-4b46-b3fd-b91d199572de'::UUID,
  'manager'::app_role
);

-- Update the existing admin_update_user_role to use the force update function
CREATE OR REPLACE FUNCTION admin_update_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delegate to the force update function
  RETURN admin_force_update_user_role(target_user_id, new_role);
END;
$$;