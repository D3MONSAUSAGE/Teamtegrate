-- Add missing assignment fields to request_types table
ALTER TABLE public.request_types 
ADD COLUMN IF NOT EXISTS selected_user_ids UUID[],
ADD COLUMN IF NOT EXISTS assignment_strategy TEXT DEFAULT 'first_available';

-- Update the assignment_strategy column to have proper constraint
ALTER TABLE public.request_types 
ADD CONSTRAINT IF NOT EXISTS check_assignment_strategy 
CHECK (assignment_strategy IN ('first_available', 'round_robin', 'least_busy', 'manual', 'auto'));