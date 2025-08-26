-- Enable real-time for meeting tables
ALTER TABLE public.meeting_requests REPLICA IDENTITY FULL;
ALTER TABLE public.meeting_participants REPLICA IDENTITY FULL;

-- Add tables to realtime publication 
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;