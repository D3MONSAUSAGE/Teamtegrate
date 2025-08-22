-- Create trigger to automatically add room creator as admin participant
CREATE OR REPLACE FUNCTION public.auto_add_creator_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.chat_participants (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_room_created_add_admin ON public.chat_rooms;

-- Create trigger to automatically add creator as admin when room is created
CREATE TRIGGER on_room_created_add_admin
  AFTER INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_creator_as_admin();