
-- Fix storage bucket to be public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Update existing invoice file paths to use standardized organization-based structure
-- First, let's see what we're working with by updating paths for existing invoices
UPDATE public.invoices 
SET file_path = CASE 
  WHEN file_path LIKE 'invoices/%' AND file_path NOT LIKE '%/%/%' THEN 
    organization_id::text || '/' || file_path
  ELSE file_path
END
WHERE file_path LIKE 'invoices/%' AND file_path NOT LIKE '%/%/%';

-- Create a function to generate consistent file paths
CREATE OR REPLACE FUNCTION public.generate_invoice_file_path(
  org_id UUID,
  user_id UUID,
  filename TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN org_id::text || '/invoices/' || EXTRACT(epoch FROM NOW())::bigint || '-' || 
         regexp_replace(filename, '[^a-zA-Z0-9.-]', '_', 'g');
END;
$$ LANGUAGE plpgsql;
