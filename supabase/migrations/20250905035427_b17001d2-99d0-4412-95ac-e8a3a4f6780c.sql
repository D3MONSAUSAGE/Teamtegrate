-- Fix training certificate storage bucket and RLS policies

-- First, ensure the training-certificates bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'training-certificates', 
  'training-certificates', 
  true,  -- Make public for easier URL access
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'];

-- Drop existing complex policies that are causing issues
DROP POLICY IF EXISTS "Users can view their certificate uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload certificate files for their assignments" ON storage.objects;

-- Create simplified, robust RLS policies for training certificates
CREATE POLICY "Certificate upload - INSERT for assigned users"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'training-certificates' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.training_assignments ta 
    WHERE ta.id::text = (storage.foldername(name))[2]
    AND ta.assigned_to = auth.uid()
    AND ta.organization_id = public.get_current_user_organization_id()
  )
);

CREATE POLICY "Certificate view - SELECT for organization users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'training-certificates'
  AND auth.uid() IS NOT NULL
  AND (
    -- Users can view their own certificates
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins/managers can view all certificates in their org
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'superadmin', 'manager')
      AND u.organization_id = public.get_current_user_organization_id()
    )
  )
);

CREATE POLICY "Certificate update - UPDATE for assigned users"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'training-certificates'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.training_assignments ta 
    WHERE ta.id::text = (storage.foldername(name))[2]
    AND ta.assigned_to = auth.uid()
    AND ta.organization_id = public.get_current_user_organization_id()
  )
);

CREATE POLICY "Certificate delete - DELETE for assigned users and admins"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'training-certificates'
  AND auth.uid() IS NOT NULL
  AND (
    -- Users can delete their own certificates
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins can delete any certificate in their org
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'superadmin', 'manager')
      AND u.organization_id = public.get_current_user_organization_id()
    )
  )
);