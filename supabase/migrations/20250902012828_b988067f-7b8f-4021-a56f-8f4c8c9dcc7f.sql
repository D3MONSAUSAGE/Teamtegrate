-- Create or replace permissions checker to include team_leader role
-- This function is used by the edge function 'update-user-role'
-- It returns a JSON object with fields:
--   allowed: boolean - whether the requester can change the target's role to new_role
--   requires_transfer: boolean - true when the change involves a superadmin target and must be handled by transfer flow
--   reason: text - optional explanation
--
-- Role rules (must match frontend):
-- - superadmin: can change anyone's role except other superadmins directly; changing a superadmin requires transfer
-- - admin: can manage manager, team_leader, user (not superadmin/admin)
-- - manager: can manage team_leader and user
-- - team_leader: can manage user
-- - user: cannot change anyone
--
-- Additional constraints:
-- - requester and target must belong to the same organization
-- - cannot set invalid roles
-- - cannot change own role except superadmin transferring to another user (handled outside this function via transfer)

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
    IF tgt_role = 'user' AND new_role = 'user' THEN
      -- Team leader can update user properties but not elevate/demote; conservatively disallow role changes
      reason := 'Team leaders cannot change roles';
      RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', reason);
    ELSE
      reason := 'Team leaders cannot change roles';
      RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', reason);
    END IF;
  END IF;

  -- Users cannot change roles
  RETURN jsonb_build_object('allowed', false, 'requires_transfer', false, 'reason', 'Insufficient permissions');
END;
$$;