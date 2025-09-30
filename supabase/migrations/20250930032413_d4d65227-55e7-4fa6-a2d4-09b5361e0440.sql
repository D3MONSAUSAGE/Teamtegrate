-- Phase 1: Add financial columns to inventory_transactions table

-- Add sale_price column (what customer paid)
ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2) DEFAULT NULL;

-- Add computed column for revenue (sales only)
ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE WHEN transaction_type = 'out' 
    THEN ABS(quantity) * COALESCE(sale_price, 0) 
    ELSE 0 
  END
) STORED;

-- Add computed column for cost of goods sold
ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS cost_of_goods DECIMAL(10,2) GENERATED ALWAYS AS (
  ABS(quantity) * COALESCE(unit_cost, 0)
) STORED;

-- Add computed column for profit (revenue - cost for sales)
ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE WHEN transaction_type = 'out' 
    THEN (COALESCE(sale_price, 0) - COALESCE(unit_cost, 0)) * ABS(quantity)
    ELSE 0 
  END
) STORED;

-- Add helpful comments
COMMENT ON COLUMN public.inventory_transactions.sale_price IS 'Price sold to customer';
COMMENT ON COLUMN public.inventory_transactions.unit_cost IS 'Cost we paid for the item (COGS)';
COMMENT ON COLUMN public.inventory_transactions.revenue IS 'Total revenue from sale (sale_price * quantity)';
COMMENT ON COLUMN public.inventory_transactions.cost_of_goods IS 'Total cost of goods (unit_cost * quantity)';
COMMENT ON COLUMN public.inventory_transactions.profit IS 'Gross profit (revenue - cost_of_goods)';

-- Update existing checkout transactions to estimate sale_price (assumes 30% markup)
UPDATE public.inventory_transactions
SET sale_price = unit_cost * 1.3
WHERE transaction_type = 'out' 
  AND sale_price IS NULL 
  AND unit_cost IS NOT NULL
  AND unit_cost > 0;