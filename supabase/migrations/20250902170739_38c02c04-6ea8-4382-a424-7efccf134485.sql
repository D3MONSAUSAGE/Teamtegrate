-- Add is_pinned column to documents table
ALTER TABLE public.documents 
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;

-- Create index for better performance when sorting by pinned status
CREATE INDEX idx_documents_pinned ON public.documents (is_pinned, created_at DESC);