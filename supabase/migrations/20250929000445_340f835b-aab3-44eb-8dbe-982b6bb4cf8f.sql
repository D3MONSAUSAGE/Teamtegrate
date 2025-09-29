-- Add organization_id column to warehouse_items table to fix receive_stock function
ALTER TABLE public.warehouse_items 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update existing records to have organization_id from their warehouse (only if column is empty)
UPDATE public.warehouse_items 
SET organization_id = w.organization_id
FROM public.warehouses w
WHERE warehouse_items.warehouse_id = w.id
AND warehouse_items.organization_id IS NULL;

-- Make organization_id NOT NULL after populating existing records (only if not already constrained)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'warehouse_items' 
        AND column_name = 'organization_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.warehouse_items 
        ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;