-- Ensure full replica identity for meeting tables
ALTER TABLE public.meeting_requests REPLICA IDENTITY FULL;
ALTER TABLE public.meeting_participants REPLICA IDENTITY FULL;