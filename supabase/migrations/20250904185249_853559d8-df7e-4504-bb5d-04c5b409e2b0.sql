-- Fix RLS recursion for meetings by introducing helper functions and simplifying policies

-- 1) Helper functions (SECURITY DEFINER) to avoid cross-table recursion
CREATE OR REPLACE FUNCTION public.is_meeting_organizer(meeting_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meeting_requests mr
    WHERE mr.id = meeting_id
      AND mr.organizer_id = user_id
      AND mr.organization_id = public.get_current_user_organization_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_meeting_participant(meeting_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meeting_participants mp
    WHERE mp.meeting_request_id = meeting_id
      AND mp.user_id = user_id
      AND mp.organization_id = public.get_current_user_organization_id()
  );
$$;

-- 2) Ensure RLS is enabled
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- 3) Drop existing recursive/conflicting policies
DROP POLICY IF EXISTS "Meeting organizers can add participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Meeting organizers can remove participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Organizers can manage participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Users can update their own participation status" ON public.meeting_participants;
DROP POLICY IF EXISTS "Users can update their own response" ON public.meeting_participants;
DROP POLICY IF EXISTS "Users can view participants for meetings they're involved in" ON public.meeting_participants;

DROP POLICY IF EXISTS "Users can view meetings they're involved in" ON public.meeting_requests;
DROP POLICY IF EXISTS "Users can create meeting requests in their organization" ON public.meeting_requests;
DROP POLICY IF EXISTS "Organizers can update their meeting requests" ON public.meeting_requests;
DROP POLICY IF EXISTS "Organizers can delete their meeting requests" ON public.meeting_requests;

-- 4) Recreate safe, non-recursive policies

-- meeting_requests
CREATE POLICY "mr_select_view_involved"
ON public.meeting_requests
FOR SELECT
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    organizer_id = auth.uid()
    OR public.is_meeting_participant(id, auth.uid())
  )
);

CREATE POLICY "mr_insert_organizer_only"
ON public.meeting_requests
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND organizer_id = auth.uid()
);

CREATE POLICY "mr_update_organizer_only"
ON public.meeting_requests
FOR UPDATE
USING (
  organization_id = public.get_current_user_organization_id()
  AND organizer_id = auth.uid()
)
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND organizer_id = auth.uid()
);

CREATE POLICY "mr_delete_organizer_only"
ON public.meeting_requests
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND organizer_id = auth.uid()
);

-- meeting_participants
CREATE POLICY "mp_select_self_or_organizer"
ON public.meeting_participants
FOR SELECT
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR public.is_meeting_organizer(meeting_request_id, auth.uid())
  )
);

CREATE POLICY "mp_insert_organizer_only"
ON public.meeting_participants
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND public.is_meeting_organizer(meeting_request_id, auth.uid())
);

CREATE POLICY "mp_update_self_or_organizer"
ON public.meeting_participants
FOR UPDATE
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR public.is_meeting_organizer(meeting_request_id, auth.uid())
  )
)
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR public.is_meeting_organizer(meeting_request_id, auth.uid())
  )
);

CREATE POLICY "mp_delete_organizer_only"
ON public.meeting_participants
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND public.is_meeting_organizer(meeting_request_id, auth.uid())
);