
-- Create storage policies for the documents bucket to allow organization-wide access to invoices

-- Policy to allow users to upload files to their own organization folder
CREATE POLICY "Users can upload to their organization folder"
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

-- Policy to allow users to view/download files from their organization
CREATE POLICY "Users can view files from their organization"
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

-- Policy to allow users to update files in their organization folder
CREATE POLICY "Users can update files in their organization"
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

-- Policy to allow users to delete files in their organization folder  
CREATE POLICY "Users can delete files in their organization"
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
