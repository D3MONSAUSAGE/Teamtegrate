-- Fix the missing foreign key constraint (skip if exists)
DO $$ 
BEGIN
  -- Add foreign key constraint for requested_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'requests_requested_by_fkey' 
    AND table_name = 'requests'
  ) THEN
    ALTER TABLE public.requests 
    ADD CONSTRAINT requests_requested_by_fkey 
    FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_requests_requested_by ON public.requests(requested_by);
  CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON public.requests(assigned_to);
END $$;