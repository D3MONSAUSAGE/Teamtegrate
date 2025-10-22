-- Update the admin_force_update_user_role function to work with actual table structure
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

  -- Update or insert into user_roles table (no updated_at column)
  INSERT INTO user_roles (user_id, role, organization_id, assigned_at)
  VALUES (target_user_id, new_role, org_id, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = new_role,
    assigned_at = now();

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