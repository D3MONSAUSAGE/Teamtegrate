
-- Remove the old restrictive storage policies that conflict with organization-wide access
DROP POLICY IF EXISTS "Allow users to read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own documents" ON storage.objects;

-- Also remove any other conflicting policies that might exist
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;

-- The organization-wide policies should remain:
-- "Users can upload files to their organization documents"
-- "Users can view files from their organization documents" 
-- "Users can update files in their organization documents"
-- "Users can delete files in their organization documents"

-- These policies check the folder structure: (storage.foldername(name))[1] = organization_id
-- This allows users to access any file in their organization's folder structure
