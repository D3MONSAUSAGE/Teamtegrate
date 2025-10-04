-- Create recruitment-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recruitment-documents',
  'recruitment-documents',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can view recruitment documents in their organization
CREATE POLICY "Users can view recruitment documents in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recruitment-documents' AND
  EXISTS (
    SELECT 1 FROM public.recruitment_documents rd
    JOIN public.recruitment_candidates rc ON rc.id = rd.candidate_id
    WHERE rd.file_url LIKE '%' || storage.objects.name
    AND rc.organization_id = public.get_current_user_organization_id()
  )
);

-- RLS Policy: Authenticated users can upload recruitment documents
CREATE POLICY "Authenticated users can upload recruitment documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recruitment-documents' AND
  auth.role() = 'authenticated'
);

-- RLS Policy: Users can update recruitment documents in their organization
CREATE POLICY "Users can update recruitment documents in their org"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recruitment-documents' AND
  auth.role() = 'authenticated'
);

-- RLS Policy: Admins and managers can delete recruitment documents
CREATE POLICY "Admins can delete recruitment documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recruitment-documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin', 'manager')
  )
);