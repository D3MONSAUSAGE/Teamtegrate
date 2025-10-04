-- Fix the sync_user_profile_across_tables function to check for column existence
CREATE OR REPLACE FUNCTION public.sync_user_profile_across_tables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if name or email changed and it's not a protected field update
  IF TG_OP = 'UPDATE' AND (
    NEW.name IS DISTINCT FROM OLD.name OR 
    NEW.email IS DISTINCT FROM OLD.email
  ) THEN
    
    -- Update tasks table where user_id matches (only if user_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'user_name'
    ) THEN
      UPDATE public.tasks 
      SET user_name = NEW.name
      WHERE user_id = NEW.id::text;
    END IF;
    
    -- Update comments table (only if user_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'comments' 
      AND column_name = 'user_name'
    ) THEN
      UPDATE public.comments 
      SET user_name = NEW.name
      WHERE user_id = NEW.id;
    END IF;
    
    -- Update project team members (only if user_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'project_team_members' 
      AND column_name = 'user_name'
    ) THEN
      UPDATE public.project_team_members 
      SET user_name = NEW.name
      WHERE user_id = NEW.id;
    END IF;
    
    -- Update meeting requests (only if organizer_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'meeting_requests' 
      AND column_name = 'organizer_name'
    ) THEN
      UPDATE public.meeting_requests 
      SET organizer_name = NEW.name
      WHERE organizer_id = NEW.id;
    END IF;
    
    -- Update chat messages (only if user_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'chat_messages' 
      AND column_name = 'user_name'
    ) THEN
      UPDATE public.chat_messages 
      SET user_name = NEW.name
      WHERE user_id = NEW.id;
    END IF;
    
    -- Update time entries (only if user_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_entries' 
      AND column_name = 'user_name'
    ) THEN
      UPDATE public.time_entries 
      SET user_name = NEW.name
      WHERE user_id = NEW.id;
    END IF;
    
    -- Update notifications (only if user_name column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'user_name'
    ) THEN
      UPDATE public.notifications 
      SET user_name = NEW.name
      WHERE user_id = NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Now run the email sync migration
-- Step 1: Update the protection trigger to allow email sync function
CREATE OR REPLACE FUNCTION public.prevent_privileged_user_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.role IS DISTINCT FROM OLD.role)
       OR (NEW.organization_id IS DISTINCT FROM OLD.organization_id)
       OR (NEW.email IS DISTINCT FROM OLD.email) THEN
      
      -- Allow updates from service_role or from within SECURITY DEFINER functions
      IF COALESCE((auth.jwt() ->> 'role'), '') = 'service_role' THEN
        RETURN NEW;
      END IF;
      
      -- Check if we're in an admin or sync function context
      IF current_setting('application_name', true) IN ('admin_function', 'email_sync_function') THEN
        RETURN NEW;
      END IF;
      
      -- Block client updates to protected fields
      RAISE EXCEPTION 'Changing protected fields (role, organization_id, email) is not allowed from client';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 2: Create email sync function with proper bypass
CREATE OR REPLACE FUNCTION public.sync_auth_email_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_app_name TEXT;
BEGIN
  -- Set application name to bypass protection trigger
  old_app_name := current_setting('application_name', true);
  PERFORM set_config('application_name', 'email_sync_function', true);
  
  -- Update public.users to match auth.users email
  UPDATE public.users
  SET email = NEW.email
  WHERE id = NEW.id;
  
  -- Reset application name
  PERFORM set_config('application_name', old_app_name, true);
  
  -- Log the sync for debugging
  RAISE LOG 'Email synced for user %: % -> %', NEW.id, OLD.email, NEW.email;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger on auth.users
DROP TRIGGER IF EXISTS sync_email_on_auth_change ON auth.users;

CREATE TRIGGER sync_email_on_auth_change
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.sync_auth_email_to_users();

-- Step 4: Fix existing email mismatches
DO $$
DECLARE
  old_app_name TEXT;
  rows_updated INTEGER;
BEGIN
  -- Set application name to bypass protection
  old_app_name := current_setting('application_name', true);
  PERFORM set_config('application_name', 'email_sync_function', true);
  
  -- Update all mismatched emails
  UPDATE public.users u
  SET email = au.email
  FROM auth.users au
  WHERE u.id = au.id
    AND u.email IS DISTINCT FROM au.email;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  -- Reset application name
  PERFORM set_config('application_name', old_app_name, true);
  
  RAISE NOTICE 'Email sync migration completed successfully';
  RAISE NOTICE 'Updated % user email(s) to match auth.users', rows_updated;
  RAISE NOTICE 'Trigger created: sync_email_on_auth_change on auth.users';
  RAISE NOTICE 'Function created: public.sync_auth_email_to_users()';
  RAISE NOTICE 'All future email changes will sync automatically';
END $$;