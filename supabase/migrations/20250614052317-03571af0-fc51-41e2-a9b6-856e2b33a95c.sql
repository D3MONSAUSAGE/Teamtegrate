
-- Phase 1: Database Schema Redesign
-- Drop existing chat tables and their dependencies
DROP TABLE IF EXISTS public.chat_message_attachments CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_room_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;

-- Drop existing functions and triggers related to chat
DROP FUNCTION IF EXISTS public.add_creator_as_participant() CASCADE;
DROP FUNCTION IF EXISTS public.user_participates_in_room(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_access_room(uuid, uuid) CASCADE;

-- Create new simplified chat schema
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in or public rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    is_public = true OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = chat_rooms.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms"
  ON public.chat_rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Room creators can delete their rooms"
  ON public.chat_rooms FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants of rooms they're in"
  ON public.chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Room admins can manage participants"
  ON public.chat_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = chat_participants.room_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Room admins can update participants"
  ON public.chat_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = chat_participants.room_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can leave rooms or admins can remove participants"
  ON public.chat_participants FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = room_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = chat_participants.room_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in rooms they participate in"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for chat_attachments
CREATE POLICY "Users can view attachments in accessible messages"
  ON public.chat_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_participants cp ON cm.room_id = cp.room_id
      WHERE cm.id = message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add attachments to their messages"
  ON public.chat_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_messages
      WHERE id = message_id AND user_id = auth.uid()
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_room_participant(room_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.room_id = is_room_participant.room_id 
    AND chat_participants.user_id = is_room_participant.user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.auto_add_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.chat_participants (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_add_creator_as_admin_trigger
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_creator_as_admin();

-- Indexes for performance
CREATE INDEX idx_chat_participants_room_user ON public.chat_participants(room_id, user_id);
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_attachments_message ON public.chat_attachments(message_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_attachments;
