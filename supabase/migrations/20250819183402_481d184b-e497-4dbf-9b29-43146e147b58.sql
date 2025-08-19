-- Add unique constraint to prevent duplicate sales data uploads
-- This ensures only one sales record per organization, date, and location
ALTER TABLE public.sales_data 
ADD CONSTRAINT unique_sales_data_per_day 
UNIQUE (organization_id, date, location);

-- Create index for better performance on duplicate checks
CREATE INDEX IF NOT EXISTS idx_sales_data_duplicate_check 
ON public.sales_data (organization_id, date, location);