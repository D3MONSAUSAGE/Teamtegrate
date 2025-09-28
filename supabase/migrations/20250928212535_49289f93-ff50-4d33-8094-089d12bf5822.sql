-- Purpose: Enforce a single posting/transactions path for warehouse receipts.
-- Safe & idempotent: drops ONLY the legacy trigger+function; keeps canonical trigger; recreates it if missing.

BEGIN;

-- 1) Drop the legacy duplicate trigger + function if they exist
DROP TRIGGER IF EXISTS create_transactions_on_receipt_posting ON public.warehouse_receipts;
DROP FUNCTION IF EXISTS public.create_transaction_from_receipt_posting();

-- 2) Ensure canonical trigger function exists (safe to re-run)
CREATE OR REPLACE FUNCTION public.trigger_create_inventory_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only on first transition to 'posted'
  IF NEW.status = 'posted' AND (OLD.status IS DISTINCT FROM 'posted') THEN
    PERFORM public.create_inventory_transaction_from_receipt_line(wrl.id)
    FROM public.warehouse_receipt_lines wrl
    WHERE wrl.receipt_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Recreate canonical trigger (safe to re-run)
DROP TRIGGER IF EXISTS after_warehouse_receipt_posted ON public.warehouse_receipts;

CREATE TRIGGER after_warehouse_receipt_posted
  AFTER UPDATE ON public.warehouse_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_inventory_transactions();

COMMIT;