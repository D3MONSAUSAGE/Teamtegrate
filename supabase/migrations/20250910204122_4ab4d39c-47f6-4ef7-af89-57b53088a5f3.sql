-- Make module_id nullable to allow standalone quizzes
ALTER TABLE public.quizzes 
ALTER COLUMN module_id DROP NOT NULL;

-- Add a comment to clarify the change
COMMENT ON COLUMN public.quizzes.module_id IS 'Module ID - NULL for standalone quizzes, UUID for module-based quizzes';