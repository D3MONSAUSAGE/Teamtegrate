-- Update the admin_force_update_user_role function to handle no unique constraints
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
  role_record_exists BOOLEAN;
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

  -- Check if user_roles record exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = target_user_id) INTO role_record_exists;

  IF role_record_exists THEN
    -- Update existing record
    UPDATE user_roles 
    SET role = new_role,
        assigned_at = now()
    WHERE user_id = target_user_id;
  ELSE
    -- Insert new record
    INSERT INTO user_roles (user_id, role, organization_id, assigned_at)
    VALUES (target_user_id, new_role, org_id, now());
  END IF;

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

-- Fix Olga's role using the updated secure function
SELECT admin_force_update_user_role(
  '85ed5883-58f8-4b46-b3fd-b91d199572de'::UUID,
  'manager'::app_role
);