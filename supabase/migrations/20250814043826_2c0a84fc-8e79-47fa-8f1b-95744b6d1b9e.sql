-- Create meeting requests table
CREATE TABLE public.meeting_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting participants table
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_request_id UUID NOT NULL REFERENCES public.meeting_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'invited' CHECK (response_status IN ('invited', 'accepted', 'declined', 'tentative')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_requests
CREATE POLICY "Users can view meeting requests in their organization"
ON public.meeting_requests FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create meeting requests in their organization"
ON public.meeting_requests FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND organizer_id = auth.uid()
);

CREATE POLICY "Organizers can update their meeting requests"
ON public.meeting_requests FOR UPDATE
USING (
  organization_id = get_current_user_organization_id() 
  AND organizer_id = auth.uid()
);

CREATE POLICY "Organizers can delete their meeting requests"
ON public.meeting_requests FOR DELETE
USING (
  organization_id = get_current_user_organization_id() 
  AND organizer_id = auth.uid()
);

-- RLS Policies for meeting_participants
CREATE POLICY "Users can view participants for meetings they're involved in"
ON public.meeting_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.meeting_requests mr 
    WHERE mr.id = meeting_request_id 
    AND mr.organization_id = get_current_user_organization_id()
    AND (mr.organizer_id = auth.uid() OR user_id = auth.uid())
  )
);

CREATE POLICY "Organizers can manage participants"
ON public.meeting_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.meeting_requests mr 
    WHERE mr.id = meeting_request_id 
    AND mr.organization_id = get_current_user_organization_id()
    AND mr.organizer_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own response"
ON public.meeting_participants FOR UPDATE
USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.meeting_requests mr 
    WHERE mr.id = meeting_request_id 
    AND mr.organization_id = get_current_user_organization_id()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_meeting_requests_updated_at
BEFORE UPDATE ON public.meeting_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-populate organization_id
CREATE TRIGGER set_meeting_requests_organization_id
BEFORE INSERT ON public.meeting_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_id_from_user();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;