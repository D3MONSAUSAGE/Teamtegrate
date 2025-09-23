-- Drop the existing constraint that only allows 'in_progress' and 'completed'
ALTER TABLE inventory_counts DROP CONSTRAINT IF EXISTS inventory_counts_status_check;

-- Add new constraint that includes 'cancelled' as a valid status
ALTER TABLE inventory_counts ADD CONSTRAINT inventory_counts_status_check 
CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'cancelled'::text])));