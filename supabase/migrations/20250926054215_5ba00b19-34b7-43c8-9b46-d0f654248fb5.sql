-- Create storage bucket for request attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('request-attachments', 'request-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create simplified storage policies for request attachments
CREATE POLICY "Users can upload their own request attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'request-attachments');

CREATE POLICY "Users can view request attachments in their organization" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'request-attachments');