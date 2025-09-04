-- Create training certificates storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-certificates',
  'training-certificates', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif']
);

-- Add certificate-related columns to training_assignments table
ALTER TABLE public.training_assignments 
ADD COLUMN certificate_url text,
ADD COLUMN certificate_status text DEFAULT 'not_required' CHECK (certificate_status IN ('not_required', 'pending', 'uploaded', 'verified', 'rejected')),
ADD COLUMN certificate_uploaded_at timestamp with time zone,
ADD COLUMN verification_notes text,
ADD COLUMN verified_by uuid REFERENCES auth.users(id),
ADD COLUMN verified_at timestamp with time zone;

-- Create RLS policies for training certificates storage
CREATE POLICY "Users can upload their own training certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'training-certificates' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.foldername(name))[2] IN (
    SELECT ta.id::text FROM public.training_assignments ta 
    WHERE ta.assigned_to = auth.uid()
  )
);

CREATE POLICY "Users can view their own training certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'training-certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all training certificates in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'training-certificates' AND
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'superadmin', 'manager')
    AND u.organization_id IN (
      SELECT ta.organization_id FROM public.training_assignments ta
      JOIN public.users assigned_user ON assigned_user.id::text = (storage.foldername(name))[1]
      WHERE assigned_user.organization_id = u.organization_id
    )
  )
);

CREATE POLICY "Users can update their own training certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'training-certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own training certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'training-certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);