-- Enable RLS on email_events table and add appropriate policies
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Allow system processes to manage email events (edge functions)
CREATE POLICY "System can manage email events" 
ON public.email_events 
FOR ALL 
USING (true) 
WITH CHECK (true);