-- Clean up duplicate sales data, keeping only the most recent record per day/location
WITH duplicates AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY organization_id, date, location 
      ORDER BY created_at DESC
    ) as rn
  FROM public.sales_data
)
DELETE FROM public.sales_data 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.sales_data 
ADD CONSTRAINT unique_sales_data_per_day 
UNIQUE (organization_id, date, location);

-- Create index for better performance on duplicate checks
CREATE INDEX IF NOT EXISTS idx_sales_data_duplicate_check 
ON public.sales_data (organization_id, date, location);