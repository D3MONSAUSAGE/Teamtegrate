-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for message reactions
CREATE POLICY "Users can view reactions in their organization" 
ON public.message_reactions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can add reactions to messages they can see" 
ON public.message_reactions 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.chat_participants cp ON cm.room_id = cp.room_id
    WHERE cm.id = message_reactions.message_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions" 
ON public.message_reactions 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND user_id = auth.uid()
);

-- Set organization_id automatically
CREATE OR REPLACE FUNCTION public.set_message_reaction_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_message_reaction_org_trigger
  BEFORE INSERT ON public.message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_message_reaction_org();

-- Add realtime
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.message_reactions;