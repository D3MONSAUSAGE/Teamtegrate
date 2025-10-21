-- Add company branding fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_state TEXT,
ADD COLUMN IF NOT EXISTS company_postal_code TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Add company branding snapshot fields to created_invoices table
ALTER TABLE created_invoices
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT;

-- Create storage bucket for invoice logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-logos',
  'invoice-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invoice logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their organization's logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their organization's logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their organization's logo" ON storage.objects;

-- Storage policies for invoice logos
CREATE POLICY "Users can view invoice logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-logos');

CREATE POLICY "Users can upload their organization's logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-logos' 
  AND auth.uid() IN (
    SELECT id FROM users WHERE organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update their organization's logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoice-logos'
  AND auth.uid() IN (
    SELECT id FROM users WHERE organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their organization's logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoice-logos'
  AND auth.uid() IN (
    SELECT id FROM users WHERE organization_id::text = (storage.foldername(name))[1]
  )
);