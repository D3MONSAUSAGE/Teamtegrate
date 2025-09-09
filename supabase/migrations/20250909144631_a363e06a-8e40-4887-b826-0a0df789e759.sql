-- Add missing assignment fields to request_types table
ALTER TABLE public.request_types 
ADD COLUMN IF NOT EXISTS selected_user_ids UUID[],
ADD COLUMN IF NOT EXISTS assignment_strategy TEXT DEFAULT 'first_available';

-- Add constraint for assignment_strategy (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_assignment_strategy') THEN
        ALTER TABLE public.request_types DROP CONSTRAINT check_assignment_strategy;
    END IF;
END $$;

ALTER TABLE public.request_types 
ADD CONSTRAINT check_assignment_strategy 
CHECK (assignment_strategy IN ('first_available', 'round_robin', 'least_busy', 'manual', 'auto'));