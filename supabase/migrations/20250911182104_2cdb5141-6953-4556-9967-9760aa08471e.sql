-- Update the RLS policy to allow meeting participants to see other participants in the same meeting
DROP POLICY IF EXISTS "mp_select_self_or_organizer" ON public.meeting_participants;

CREATE POLICY "meeting_participants_can_see_each_other" 
ON public.meeting_participants 
FOR SELECT 
USING (
  -- Users can see their own participation record
  user_id = auth.uid() 
  OR 
  -- Organizers can see all participants in their meetings
  is_meeting_organizer(meeting_request_id, auth.uid())
  OR
  -- Participants can see other participants in meetings they're part of
  EXISTS (
    SELECT 1 FROM public.meeting_participants mp2 
    WHERE mp2.meeting_request_id = meeting_participants.meeting_request_id 
    AND mp2.user_id = auth.uid()
  )
);