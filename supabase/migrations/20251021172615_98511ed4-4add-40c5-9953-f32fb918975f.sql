-- Drop the problematic RLS policies for invoice-logos
DROP POLICY IF EXISTS "Users can view invoice logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their organization's logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their organization's logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their organization's logo" ON storage.objects;

-- Create simpler, working RLS policies matching product-images pattern
CREATE POLICY "Users can view invoice logos" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'invoice-logos');

CREATE POLICY "Authenticated users can upload invoice logos" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'invoice-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update invoice logos" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'invoice-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete invoice logos" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'invoice-logos' 
  AND auth.role() = 'authenticated'
);