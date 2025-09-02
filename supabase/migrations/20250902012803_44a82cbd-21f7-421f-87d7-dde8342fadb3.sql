-- Fix replacing function by dropping prior signature first, then recreating with team_leader support
DROP FUNCTION IF EXISTS public.can_change_user_role(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.can_change_user_role(
  requester_id uuid,
  target_user_id uuid,
  new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_role text;
  tgt_role text;
  req_org uuid;
  tgt_org uuid;
  allowed boolean := false;
  requires_transfer boolean := false;
  reason text := NULL;
BEGIN
  -- Validate new_role
  IF new_role NOT IN ('superadmin','admin','manager','team_leader','user') THEN
    RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Invalid role');
  END IF;

  -- Load requester
  SELECT role, organization_id INTO req_role, req_org
  FROM public.users WHERE id = requester_id;
  IF req_role IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Requester not found');
  END IF;

  -- Load target
  SELECT role, organization_id INTO tgt_role, tgt_org
  FROM public.users WHERE id = target_user_id;
  IF tgt_role IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Target user not found');
  END IF;

  -- Same organization check
  IF req_org IS NULL OR tgt_org IS NULL OR req_org <> tgt_org THEN
    RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Users not in same organization');
  END IF;

  -- Prevent changing own role via this path (except transfer flow)
  IF requester_id = target_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Cannot change own role');
  END IF;

  -- Superadmin rules
  IF req_role = 'superadmin' THEN
    -- Cannot directly modify another superadmin; must use transfer flow
    IF tgt_role = 'superadmin' THEN
      RETURN jsonb_build_object('allowed', false, 'requires_transfer', true, 'reason', 'Use transfer flow for superadmin');
    END IF;
    -- Otherwise can assign any role
    allowed := true;
    RETURN jsonb_build_object('allowed', allowed, 'requires_transfer', requires_transfer, 'reason', reason);
  END IF;

  -- Admin rules
  IF req_role = 'admin' THEN
    -- Can manage manager, team_leader, user
    IF tgt_role IN ('manager','team_leader','user') AND new_role IN ('manager','team_leader','user') THEN
      allowed := true;
      RETURN jsonb_build_object('allowed', allowed, 'requires_transfer', requires_transfer, 'reason', reason);
    ELSE
      reason := 'Admins can manage manager, team_leader, user roles only';
      RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', reason);
    END IF;
  END IF;

  -- Manager rules
  IF req_role = 'manager' THEN
    -- Can manage team_leader and user
    IF tgt_role IN ('team_leader','user') AND new_role IN ('team_leader','user') THEN
      allowed := true;
      RETURN jsonb_build_object('allowed', allowed, 'requires_transfer', requires_transfer, 'reason', reason);
    ELSE
      reason := 'Managers can manage team_leader and user roles only';
      RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', reason);
    END IF;
  END IF;

  -- Team leader rules
  IF req_role = 'team_leader' THEN
    -- Team leaders can only manage users; we disallow role changes via this function
    RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Team leaders cannot change roles');
  END IF;

  -- Users cannot change roles
  RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Insufficient permissions');
END;
$$;