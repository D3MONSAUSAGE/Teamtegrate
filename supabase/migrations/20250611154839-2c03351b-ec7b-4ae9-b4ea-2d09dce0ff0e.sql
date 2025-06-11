
-- First, let's add the organization_id column to users table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE public.users ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Create the default "Legacy Org" organization (if it doesn't exist)
INSERT INTO public.organizations (id, name, created_by, created_at)
SELECT gen_random_uuid(), 'Legacy Org', (SELECT id FROM public.users LIMIT 1), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Legacy Org');

-- Assign all existing users to the Legacy Org (only if they don't have an organization)
UPDATE public.users 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org'
)
WHERE organization_id IS NULL;

-- Make organization_id non-nullable (if it's currently nullable)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'organization_id' AND is_nullable = 'YES') THEN
        ALTER TABLE public.users ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view users in same organization" ON public.users;
DROP POLICY IF EXISTS "Admins can update users in same organization" ON public.users;
DROP POLICY IF EXISTS "Superadmins can insert users in same organization" ON public.users;
DROP POLICY IF EXISTS "Superadmins can delete users in same organization" ON public.users;

-- Users can only see users in their own organization
CREATE POLICY "Users can view users in same organization" 
ON public.users 
FOR SELECT 
USING (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

-- Admins can update users in their own organization
CREATE POLICY "Admins can update users in same organization" 
ON public.users 
FOR UPDATE 
USING (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Superadmins can insert users (check organization matches current user's org)
CREATE POLICY "Superadmins can insert users in same organization" 
ON public.users 
FOR INSERT 
WITH CHECK (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Superadmins can delete users in their organization
CREATE POLICY "Superadmins can delete users in same organization" 
ON public.users 
FOR DELETE 
USING (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing organization policies if they exist
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Superadmins can update their organization" ON public.organizations;

-- Users can only see their own organization
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (
  id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

-- Superadmins can update their organization
CREATE POLICY "Superadmins can update their organization" 
ON public.organizations 
FOR UPDATE 
USING (
  id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Update the handle_new_user function to assign new users to an organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the Legacy Org ID
  SELECT id INTO default_org_id FROM public.organizations WHERE name = 'Legacy Org';
  
  IF default_org_id IS NULL THEN
    INSERT INTO public.organizations (id, name, created_by, created_at)
    VALUES (gen_random_uuid(), 'Legacy Org', NEW.id, NOW())
    RETURNING id INTO default_org_id;
  END IF;

  -- Insert user with organization assignment
  INSERT INTO public.users (id, name, email, role, organization_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    default_org_id
  );
  
  RETURN NEW;
END;
$$;
