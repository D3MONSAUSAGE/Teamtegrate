-- 1) Add organization_id to chat_participants and backfill
ALTER TABLE public.chat_participants
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Backfill from chat_rooms
UPDATE public.chat_participants cp
SET organization_id = cr.organization_id
FROM public.chat_rooms cr
WHERE cp.room_id = cr.id AND cp.organization_id IS NULL;

-- 2) Trigger to keep organization_id in sync from the room
CREATE OR REPLACE FUNCTION public.set_chat_participant_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL OR NEW.room_id IS DISTINCT FROM OLD.room_id THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_rooms WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_chat_participant_org ON public.chat_participants;
CREATE TRIGGER trg_set_chat_participant_org
BEFORE INSERT OR UPDATE OF room_id ON public.chat_participants
FOR EACH ROW
EXECUTE FUNCTION public.set_chat_participant_org();

-- 3) Replace chat_participants policies to avoid referencing chat_rooms in SELECT
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_participants'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_participants', policy_name);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Organization-scoped SELECT without cross-table references
CREATE POLICY "Participants select by org"
ON public.chat_participants
FOR SELECT
USING (
  organization_id = get_current_user_organization_id()
);

-- Allow joining self or room admins to add others; include org check
CREATE POLICY "Participants insert (self or room admin)"
ON public.chat_participants
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    auth.uid() = user_id OR is_user_room_admin(room_id, auth.uid())
  )
);

-- Allow updates by self or room admin; include org check
CREATE POLICY "Participants update (self or room admin)"
ON public.chat_participants
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    auth.uid() = user_id OR is_user_room_admin(room_id, auth.uid())
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    auth.uid() = user_id OR is_user_room_admin(room_id, auth.uid())
  )
);

-- Allow delete (leave) by self or room admin; include org check
CREATE POLICY "Participants delete (self or room admin)"
ON public.chat_participants
FOR DELETE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    auth.uid() = user_id OR is_user_room_admin(room_id, auth.uid())
  )
);
