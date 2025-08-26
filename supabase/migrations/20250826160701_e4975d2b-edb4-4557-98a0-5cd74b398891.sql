-- Fix recursive RLS on chat_rooms by replacing policies with non-recursive rules
-- Enable RLS (safe if already enabled)
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on chat_rooms to avoid recursion
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_rooms'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_rooms', policy_name);
  END LOOP;
END $$;

-- Allow users to view rooms they can access without recursive references
CREATE POLICY "Users can view accessible rooms"
ON public.chat_rooms
FOR SELECT
USING (
  organization_id = get_current_user_organization_id()
  AND (
    is_public = true
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.room_id = chat_rooms.id AND cp.user_id = auth.uid()
    )
  )
);

-- Allow users to create rooms in their organization
CREATE POLICY "Users can create rooms in their organization"
ON public.chat_rooms
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND created_by = auth.uid()
);

-- Room creators can update their rooms
CREATE POLICY "Room creators can update their rooms"
ON public.chat_rooms
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND created_by = auth.uid()
)
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND created_by = auth.uid()
);

-- Room creators can delete their rooms
CREATE POLICY "Room creators can delete their rooms"
ON public.chat_rooms
FOR DELETE
USING (
  organization_id = get_current_user_organization_id()
  AND created_by = auth.uid()
);
