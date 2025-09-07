-- Use the existing Edge Function approach with proper admin override
-- Create a temporary function to directly update Josue's role
CREATE OR REPLACE FUNCTION public.admin_role_update(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  target_org_id uuid;
BEGIN
  -- Get current user context
  current_user_id := auth.uid();
  
  -- Get current user's role and org
  SELECT role, organization_id INTO current_user_role, target_org_id
  FROM public.users 
  WHERE id = current_user_id;
  
  -- Only allow superadmins to update roles
  IF current_user_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Update the target user's role directly
  UPDATE public.users 
  SET role = new_role
  WHERE id = target_user_id 
    AND organization_id = target_org_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', 'Role updated successfully');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'User not found or not in same organization');
  END IF;
END;
$$;

-- Execute the role update for Josue
SELECT public.admin_role_update(
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931'::uuid,
  'admin'
) AS result;