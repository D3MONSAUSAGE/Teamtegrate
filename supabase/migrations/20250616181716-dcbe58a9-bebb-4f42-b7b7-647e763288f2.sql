
-- First, remove the conflicting storage policies for the non-existent 'invoices' bucket
DROP POLICY IF EXISTS "Users can upload to their organization folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files in their organization" ON storage.objects;

-- Create new storage policies for the 'documents' bucket with the correct organization-first path format
CREATE POLICY "Users can upload files to their organization documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = (
    SELECT organization_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view files from their organization documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = (
    SELECT organization_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update files in their organization documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = (
    SELECT organization_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete files in their organization documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = (
    SELECT organization_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Update existing invoice records to use the new organization-first path format
UPDATE public.invoices 
SET file_path = CASE 
  WHEN file_path LIKE 'invoices/%' THEN 
    (SELECT organization_id::text FROM public.users WHERE id = invoices.user_id) || 
    '/invoices/' || 
    SUBSTRING(file_path FROM 'invoices/[^/]+/(.+)')
  ELSE file_path
END
WHERE file_path LIKE 'invoices/%';

-- Add RLS policies for invoices table to ensure organization-level access
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices from their organization"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert invoices to their organization"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update invoices in their organization"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete invoices in their organization"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
