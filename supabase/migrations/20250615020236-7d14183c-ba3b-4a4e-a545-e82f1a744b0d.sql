
-- Fix infinite recursion in chat_participants RLS policies
-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants of rooms they're in" ON public.chat_participants;
DROP POLICY IF EXISTS "Room admins can manage participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Room admins can update participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms or admins can remove participants" ON public.chat_participants;

-- Create helper functions to avoid recursion
CREATE OR REPLACE FUNCTION public.can_user_access_room(room_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Check if user can access the room (either it's public or they're a participant)
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = room_id_param 
    AND (cr.is_public = true OR cr.created_by = user_id_param)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_user_room_admin(room_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Check if user is room creator (admin)
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = room_id_param 
    AND cr.created_by = user_id_param
  );
$$;

-- Create new non-recursive policies for chat_participants
CREATE POLICY "Users can view participants of accessible rooms"
  ON public.chat_participants FOR SELECT
  USING (public.can_user_access_room(room_id, auth.uid()));

CREATE POLICY "Room creators and admins can add participants"
  ON public.chat_participants FOR INSERT
  WITH CHECK (public.is_user_room_admin(room_id, auth.uid()));

CREATE POLICY "Room creators and admins can update participants"
  ON public.chat_participants FOR UPDATE
  USING (public.is_user_room_admin(room_id, auth.uid()));

CREATE POLICY "Users can leave rooms or admins can remove participants"
  ON public.chat_participants FOR DELETE
  USING (
    user_id = auth.uid() OR 
    public.is_user_room_admin(room_id, auth.uid())
  );
