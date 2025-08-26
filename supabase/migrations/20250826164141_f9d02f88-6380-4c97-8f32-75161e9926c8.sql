
-- Fix duplicate participant insertion by consolidating triggers and hardening the function

-- 1) Create or replace the function with ON CONFLICT DO NOTHING for safety
CREATE OR REPLACE FUNCTION public.auto_add_creator_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Add creator as admin participant; ignore if already present
  INSERT INTO public.chat_participants (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (room_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) Ensure we only have a single trigger wired up on chat_rooms inserts
DROP TRIGGER IF EXISTS auto_add_creator_as_admin_trigger ON public.chat_rooms;
DROP TRIGGER IF EXISTS on_room_created_add_admin ON public.chat_rooms;

-- 3) Recreate a single canonical trigger
CREATE TRIGGER on_room_created_add_admin
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_creator_as_admin();
