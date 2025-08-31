-- Add document_id field to bulletin_posts table to link posts to documents
ALTER TABLE public.bulletin_posts 
ADD COLUMN document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL;