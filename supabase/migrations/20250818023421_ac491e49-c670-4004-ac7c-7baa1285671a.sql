-- CRITICAL SECURITY FIXES - Phase 1: Database Security Hardening

-- 1. Fix Public Journal Entries Exposure - Remove public access policy
DROP POLICY IF EXISTS "Users can view public journal entries" ON public.journal_entries;

-- 2. Secure Chat System - Remove public access policies  
DROP POLICY IF EXISTS "Users can view rooms they participate in or public rooms" ON public.chat_rooms;

-- Create new secure chat room policy - only for authenticated users in same organization
CREATE POLICY "Users can view rooms in their organization" 
ON public.chat_rooms 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_participants.room_id = chat_rooms.id 
      AND chat_participants.user_id = auth.uid()
    )
  )
);

-- 3. Add search path protection to critical functions
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_auth_uid UUID;
  found_org_id UUID;
BEGIN
  current_auth_uid := auth.uid();
  
  RAISE LOG 'get_current_user_organization_id: auth.uid() = %', current_auth_uid;
  
  IF current_auth_uid IS NULL THEN
    RAISE LOG 'get_current_user_organization_id: No authenticated user found';
    RETURN NULL;
  END IF;
  
  SELECT organization_id INTO found_org_id 
  FROM public.users 
  WHERE id = current_auth_uid;
  
  RAISE LOG 'get_current_user_organization_id: Found org_id = % for user = %', found_org_id, current_auth_uid;
  
  RETURN found_org_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.can_change_user_role(manager_user_id uuid, target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  manager_info RECORD;
  target_info RECORD;
  result JSONB;
  would_leave_without_superadmin BOOLEAN;
  existing_superadmin_count INTEGER;
  existing_superadmin_id UUID;
BEGIN
  SELECT role, organization_id, email, name INTO manager_info
  FROM public.users
  WHERE id = manager_user_id;

  SELECT role, organization_id, email, name INTO target_info
  FROM public.users
  WHERE id = target_user_id;

  IF manager_info.organization_id != target_info.organization_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Users must be in the same organization'
    );
  END IF;

  IF manager_user_id = target_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Cannot modify your own role'
    );
  END IF;

  IF manager_info.role != 'superadmin' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Only superadmins can change user roles'
    );
  END IF;

  IF target_info.role = 'superadmin' AND new_role != 'superadmin' THEN
    SELECT public.would_leave_org_without_superadmin(target_user_id, target_info.organization_id) 
    INTO would_leave_without_superadmin;
    
    IF would_leave_without_superadmin THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Cannot demote the only superadmin. Promote another user to superadmin first.'
      );
    END IF;
  END IF;

  IF new_role = 'superadmin' AND target_info.role != 'superadmin' THEN
    SELECT COUNT(*), MIN(id) INTO existing_superadmin_count, existing_superadmin_id
    FROM public.users
    WHERE organization_id = target_info.organization_id 
      AND role = 'superadmin'
      AND id != target_user_id;
    
    IF existing_superadmin_count > 0 THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'requires_transfer', true,
        'current_superadmin_id', existing_superadmin_id,
        'current_superadmin_name', (
          SELECT name FROM public.users WHERE id = existing_superadmin_id
        ),
        'reason', 'Promoting this user to superadmin will automatically demote the current superadmin to admin role.'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'requires_transfer', false,
    'reason', null
  );
END;
$function$;

-- 4. Add WITH CHECK clauses to critical UPDATE policies

-- Fix users table UPDATE policy
DROP POLICY IF EXISTS "Users can update their own user" ON public.users;
CREATE POLICY "Users can update their own user" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix tasks table UPDATE policies
DROP POLICY IF EXISTS "tasks_strict_update" ON public.tasks;
CREATE POLICY "tasks_strict_update" 
ON public.tasks 
FOR UPDATE 
USING (can_user_access_task(id, auth.uid()))
WITH CHECK (can_user_access_task(id, auth.uid()));

-- Fix comments UPDATE policy
DROP POLICY IF EXISTS "comments_update_own_or_admin" ON public.comments;
CREATE POLICY "comments_update_own_or_admin" 
ON public.comments 
FOR UPDATE 
USING (
  (organization_id = get_current_user_organization_id()) 
  AND (
    (user_id = auth.uid()) 
    OR (
      (SELECT role FROM users WHERE id = auth.uid()) = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  )
)
WITH CHECK (
  (organization_id = get_current_user_organization_id()) 
  AND (
    (user_id = auth.uid()) 
    OR (
      (SELECT role FROM users WHERE id = auth.uid()) = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  )
);

-- 5. Add organization isolation check for chat rooms
CREATE POLICY "chat_rooms_insert_organization" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id());

-- 6. Strengthen chat participants policies
CREATE POLICY "chat_participants_organization_access" 
ON public.chat_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_participants.room_id 
    AND chat_rooms.organization_id = get_current_user_organization_id()
  )
);