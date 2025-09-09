-- Add file support to training modules
ALTER TABLE public.training_modules 
ADD COLUMN file_path text,
ADD COLUMN file_name text,
ADD COLUMN file_size bigint;

-- Create index for file_path for better performance
CREATE INDEX idx_training_modules_file_path ON public.training_modules(file_path) WHERE file_path IS NOT NULL;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.training_modules.file_path IS 'Storage path for uploaded training files';
COMMENT ON COLUMN public.training_modules.file_name IS 'Original filename of uploaded training file';  
COMMENT ON COLUMN public.training_modules.file_size IS 'File size in bytes for uploaded training files';