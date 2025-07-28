-- Security hardening: Fix database function security issues
-- 1. Add secure search path to critical functions
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_auth_uid UUID;
  found_org_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_auth_uid := auth.uid();
  
  -- Debug logging
  RAISE LOG 'get_current_user_organization_id: auth.uid() = %', current_auth_uid;
  
  -- If auth.uid() is null, return null immediately
  IF current_auth_uid IS NULL THEN
    RAISE LOG 'get_current_user_organization_id: No authenticated user found';
    RETURN NULL;
  END IF;
  
  -- Get the organization_id for the authenticated user
  SELECT organization_id INTO found_org_id 
  FROM public.users 
  WHERE id = current_auth_uid;
  
  -- Debug logging
  RAISE LOG 'get_current_user_organization_id: Found org_id = % for user = %', found_org_id, current_auth_uid;
  
  RETURN found_org_id;
END;
$function$;

-- 2. Add role field protection to users table RLS
CREATE POLICY "users_role_protection" ON public.users
FOR UPDATE 
USING (
  -- Only superadmins can change roles
  (auth.uid() = id AND column_name != 'role') OR
  (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ))
);

-- 3. Secure chat message insertion with organization validation
CREATE OR REPLACE FUNCTION public.validate_chat_message_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure message is created in user's organization
  IF NEW.organization_id != get_current_user_organization_id() THEN
    RAISE EXCEPTION 'Cannot create message in different organization';
  END IF;
  
  -- Auto-populate organization_id if not provided
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_current_user_organization_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Apply trigger to chat_messages if organization_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'organization_id'
  ) THEN
    DROP TRIGGER IF EXISTS validate_chat_message_org ON public.chat_messages;
    CREATE TRIGGER validate_chat_message_org
      BEFORE INSERT ON public.chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_chat_message_organization();
  END IF;
END $$;

-- 4. Add input validation for sensitive fields
CREATE OR REPLACE FUNCTION public.validate_user_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate role values
  IF NEW.role IS NOT NULL AND NEW.role NOT IN ('user', 'manager', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'Invalid role value';
  END IF;
  
  -- Sanitize name field
  IF NEW.name IS NOT NULL THEN
    NEW.name := trim(regexp_replace(NEW.name, '[<>"\''&]', '', 'g'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Apply validation trigger to users table
DROP TRIGGER IF EXISTS validate_user_input_trigger ON public.users;
CREATE TRIGGER validate_user_input_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_input();