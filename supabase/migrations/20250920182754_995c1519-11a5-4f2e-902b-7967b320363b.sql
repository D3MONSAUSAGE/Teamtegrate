-- Update the requests table status constraint to include 'in_progress'
-- First, drop the existing constraint
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Add the updated constraint with 'in_progress' included
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'pending_acceptance', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'));