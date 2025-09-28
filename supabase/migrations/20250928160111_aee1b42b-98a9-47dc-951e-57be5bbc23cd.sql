-- Add missing columns to warehouse_receipts table
ALTER TABLE public.warehouse_receipts 
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add missing column to warehouse_receipt_lines table  
ALTER TABLE public.warehouse_receipt_lines
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to auto-update updated_at column for warehouse_receipts
CREATE OR REPLACE FUNCTION update_warehouse_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_warehouse_receipts_updated_at ON public.warehouse_receipts;

-- Create the trigger
CREATE TRIGGER trigger_update_warehouse_receipts_updated_at
  BEFORE UPDATE ON public.warehouse_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_receipts_updated_at();

-- Update the post_warehouse_receipt function to use posted_by properly
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, text);

CREATE OR REPLACE FUNCTION public.post_warehouse_receipt(
  p_receipt_id uuid,
  p_user text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wh_id  uuid;
  v_now    timestamptz := now();
  v_summary jsonb;
  v_user_uuid uuid;
BEGIN
  -- Convert text user to uuid if needed
  BEGIN
    v_user_uuid := p_user::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid user ID format: %', p_user;
  END;

  -- Must be draft
  PERFORM 1 FROM warehouse_receipts r
   WHERE r.id = p_receipt_id AND r.status = 'draft';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt % not found or not draft', p_receipt_id;
  END IF;

  SELECT warehouse_id INTO v_wh_id
  FROM warehouse_receipts WHERE id = p_receipt_id;

  -- Aggregate lines and bump stock (simple add)
  WITH agg AS (
    SELECT item_id, SUM(qty)::numeric AS qty, COALESCE(MAX(unit_cost),0)::numeric AS last_cost
    FROM warehouse_receipt_lines
    WHERE receipt_id = p_receipt_id
    GROUP BY item_id
  )
  INSERT INTO warehouse_items AS wi
        (warehouse_id, item_id, on_hand, sale_price)
  SELECT v_wh_id, a.item_id, a.qty, a.last_cost
    FROM agg a
  ON CONFLICT (warehouse_id, item_id)
  DO UPDATE SET
    on_hand    = wi.on_hand + EXCLUDED.on_hand,
    sale_price = EXCLUDED.sale_price;

  -- Mark receipt as posted with proper user tracking
  UPDATE warehouse_receipts
     SET status='posted', 
         posted_at=v_now, 
         posted_by=v_user_uuid,
         received_at=COALESCE(received_at, v_now), 
         updated_at=v_now
   WHERE id = p_receipt_id;

  UPDATE warehouse_receipt_lines SET posted_at=v_now WHERE receipt_id = p_receipt_id;

  SELECT jsonb_build_object(
           'success', true,
           'receipt_id', r.id,
           'warehouse_id', r.warehouse_id,
           'posted_at', r.posted_at,
           'posted_by', r.posted_by,
           'message', 'Receipt posted successfully')
    INTO v_summary
  FROM warehouse_receipts r WHERE r.id = p_receipt_id;

  RETURN v_summary;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_warehouse_receipt(uuid, text) TO authenticated;