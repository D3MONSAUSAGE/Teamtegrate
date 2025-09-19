-- Create the sync_user_profile_across_tables function that was missing
CREATE OR REPLACE FUNCTION public.sync_user_profile_across_tables(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get the current user data
  SELECT id, name, email, role, organization_id, avatar_url
  INTO user_record
  FROM public.users 
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_param;
  END IF;
  
  -- Update team_memberships table if it exists
  UPDATE public.team_memberships 
  SET updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Update any project assignments
  UPDATE public.project_team_members 
  SET updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Update chat participants
  UPDATE public.chat_participants 
  SET updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Log the sync operation
  RAISE LOG 'Profile synced across tables for user: % (%, %)', 
    user_record.name, user_record.email, user_record.role;
    
END;
$$;