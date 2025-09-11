-- Fix infinite recursion in meeting participants RLS by using security definer function
DROP POLICY IF EXISTS "mp_select_self_or_organizer" ON public.meeting_participants;
DROP POLICY IF EXISTS "meeting_participants_can_see_each_other" ON public.meeting_participants;

CREATE POLICY "meeting_participants_can_see_each_other" 
ON public.meeting_participants 
FOR SELECT 
USING (
  -- Users can see their own participation record
  user_id = auth.uid() 
  OR 
  -- Organizers can see all participants in their meetings
  public.is_meeting_organizer(meeting_request_id, auth.uid())
  OR
  -- Participants can see other participants in meetings they're part of
  public.is_meeting_participant(meeting_request_id, auth.uid())
);