-- 1) Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  address text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_wh_org ON public.warehouses (organization_id, is_primary);

-- 2) Warehouse stock (on hand + weighted average cost)
CREATE TABLE IF NOT EXISTS public.warehouse_items (
  warehouse_id uuid NOT NULL,
  item_id uuid NOT NULL,
  on_hand numeric(18,3) NOT NULL DEFAULT 0,
  wac_unit_cost numeric(18,4) NOT NULL DEFAULT 0,
  reorder_min numeric(18,3),
  reorder_max numeric(18,3),
  PRIMARY KEY (warehouse_id, item_id),
  CONSTRAINT fk_wi_wh   FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_wi_item FOREIGN KEY (item_id)       REFERENCES public.inventory_items (id) ON DELETE CASCADE
);

-- 3) Receipts (into warehouse)
CREATE TABLE IF NOT EXISTS public.warehouse_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL,
  vendor_name text,
  vendor_invoice text,
  received_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric(18,2) DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_wr_wh FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.warehouse_receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL,
  item_id uuid NOT NULL,
  qty numeric(18,3) NOT NULL,
  unit_cost numeric(18,4) NOT NULL,
  line_total numeric(18,2) GENERATED ALWAYS AS (qty * unit_cost) STORED,
  CONSTRAINT fk_wrl_wr   FOREIGN KEY (receipt_id) REFERENCES public.warehouse_receipts (id) ON DELETE CASCADE,
  CONSTRAINT fk_wrl_item FOREIGN KEY (item_id)     REFERENCES public.inventory_items (id) ON DELETE CASCADE
);

-- 4) Transfers (warehouse -> team)
CREATE TABLE IF NOT EXISTS public.warehouse_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL,
  to_team_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  transfer_no text,
  sent_at timestamptz,
  received_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  charge_subtotal numeric(18,2) DEFAULT 0,
  CONSTRAINT fk_wt_wh   FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_wt_team FOREIGN KEY (to_team_id)   REFERENCES public.teams (id)       ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_wt_transfer_no ON public.warehouse_transfers (transfer_no) WHERE transfer_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.warehouse_transfer_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL,
  item_id uuid NOT NULL,
  qty numeric(18,3) NOT NULL,
  unit_price numeric(18,4) NOT NULL,
  line_total numeric(18,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
  CONSTRAINT fk_wtl_wt   FOREIGN KEY (transfer_id) REFERENCES public.warehouse_transfers (id) ON DELETE CASCADE,
  CONSTRAINT fk_wtl_item FOREIGN KEY (item_id)     REFERENCES public.inventory_items (id) ON DELETE CASCADE
);

-- 5) Helper view for the "Recent Transfers" panel
CREATE OR REPLACE VIEW public.v_team_recent_transfers AS
SELECT
  wt.to_team_id as team_id,
  wt.id         as transfer_id,
  wt.status,
  wt.sent_at,
  wtl.item_id,
  wtl.qty,
  wtl.unit_price
FROM public.warehouse_transfers wt
JOIN public.warehouse_transfer_lines wtl ON wtl.transfer_id = wt.id
WHERE wt.status IN ('sent','received');

-- Functions for warehouse operations
CREATE OR REPLACE FUNCTION public.post_warehouse_receipt(p_receipt_id uuid, p_user uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
  r record; 
  cur_on_hand numeric; 
  cur_wac numeric;
BEGIN
  -- Update receipt status
  UPDATE public.warehouse_receipts
  SET status='posted', received_at=COALESCE(received_at, now())
  WHERE id=p_receipt_id AND status='draft';

  -- Process each receipt line
  FOR r IN
    SELECT wr.warehouse_id, wrl.item_id, wrl.qty, wrl.unit_cost
    FROM public.warehouse_receipts wr
    JOIN public.warehouse_receipt_lines wrl ON wrl.receipt_id = wr.id
    WHERE wr.id = p_receipt_id
  LOOP
    -- Get current stock and WAC
    SELECT on_hand, wac_unit_cost INTO cur_on_hand, cur_wac
    FROM public.warehouse_items
    WHERE warehouse_id=r.warehouse_id AND item_id=r.item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Insert new warehouse item
      INSERT INTO public.warehouse_items(warehouse_id, item_id, on_hand, wac_unit_cost)
      VALUES (r.warehouse_id, r.item_id, r.qty, r.unit_cost);
    ELSE
      -- Update existing with weighted average cost
      UPDATE public.warehouse_items
      SET on_hand = on_hand + r.qty,
          wac_unit_cost = CASE
            WHEN (cur_on_hand + r.qty) = 0 THEN r.unit_cost
            ELSE ((cur_on_hand * cur_wac) + (r.qty * r.unit_cost)) / (cur_on_hand + r.qty)
          END
      WHERE warehouse_id=r.warehouse_id AND item_id=r.item_id;
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.send_warehouse_transfer(p_transfer_id uuid, p_user uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
  r record; 
  cur_on_hand numeric; 
  cur_wac numeric;
BEGIN
  -- Update transfer status
  UPDATE public.warehouse_transfers
  SET status='sent', sent_at=now()
  WHERE id=p_transfer_id AND status='draft';

  -- Process each transfer line
  FOR r IN
    SELECT wt.warehouse_id, wtl.item_id, wtl.qty
    FROM public.warehouse_transfers wt
    JOIN public.warehouse_transfer_lines wtl ON wtl.transfer_id=wt.id
    WHERE wt.id=p_transfer_id
  LOOP
    -- Get current stock and WAC
    SELECT on_hand, wac_unit_cost INTO cur_on_hand, cur_wac
    FROM public.warehouse_items
    WHERE warehouse_id=r.warehouse_id AND item_id=r.item_id
    FOR UPDATE;

    IF NOT FOUND OR cur_on_hand < r.qty THEN
      RAISE EXCEPTION 'Insufficient stock for item %', r.item_id;
    END IF;

    -- Reduce on hand quantity
    UPDATE public.warehouse_items
    SET on_hand = on_hand - r.qty
    WHERE warehouse_id=r.warehouse_id AND item_id=r.item_id;

    -- Set unit price to WAC if not set
    UPDATE public.warehouse_transfer_lines
    SET unit_price = CASE WHEN unit_price <= 0 THEN cur_wac ELSE unit_price END
    WHERE transfer_id=p_transfer_id AND item_id=r.item_id;
  END LOOP;

  -- Update transfer subtotal
  UPDATE public.warehouse_transfers wt
  SET charge_subtotal = COALESCE((
    SELECT SUM(line_total) 
    FROM public.warehouse_transfer_lines 
    WHERE transfer_id=p_transfer_id
  ), 0)
  WHERE wt.id = p_transfer_id;
END $$;

CREATE OR REPLACE FUNCTION public.receive_warehouse_transfer(p_transfer_id uuid, p_user uuid)
RETURNS void 
LANGUAGE sql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.warehouse_transfers
  SET status='received', received_at=now()
  WHERE id=p_transfer_id AND status='sent';
$$;

-- Enable RLS on all warehouse tables
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfer_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Warehouses
DROP POLICY IF EXISTS "Users can view warehouses in their organization" ON public.warehouses;
CREATE POLICY "Users can view warehouses in their organization"
ON public.warehouses FOR SELECT
USING (organization_id = get_current_user_organization_id());

DROP POLICY IF EXISTS "Managers can manage warehouses" ON public.warehouses;
CREATE POLICY "Managers can manage warehouses"
ON public.warehouses FOR ALL
USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS Policies for Warehouse Items
DROP POLICY IF EXISTS "Users can view warehouse items in their organization" ON public.warehouse_items;
CREATE POLICY "Users can view warehouse items in their organization"
ON public.warehouse_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_items.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
);

DROP POLICY IF EXISTS "Managers can manage warehouse items" ON public.warehouse_items;
CREATE POLICY "Managers can manage warehouse items"
ON public.warehouse_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_items.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_items.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS Policies for Warehouse Receipts
DROP POLICY IF EXISTS "Users can view warehouse receipts in their organization" ON public.warehouse_receipts;
CREATE POLICY "Users can view warehouse receipts in their organization"
ON public.warehouse_receipts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_receipts.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
);

DROP POLICY IF EXISTS "Managers can manage warehouse receipts" ON public.warehouse_receipts;
CREATE POLICY "Managers can manage warehouse receipts"
ON public.warehouse_receipts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_receipts.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_receipts.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS Policies for Warehouse Receipt Lines
DROP POLICY IF EXISTS "Users can view warehouse receipt lines in their organization" ON public.warehouse_receipt_lines;
CREATE POLICY "Users can view warehouse receipt lines in their organization"
ON public.warehouse_receipt_lines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM warehouse_receipts wr
    JOIN warehouses w ON w.id = wr.warehouse_id
    WHERE wr.id = warehouse_receipt_lines.receipt_id 
    AND w.organization_id = get_current_user_organization_id()
  )
);

DROP POLICY IF EXISTS "Managers can manage warehouse receipt lines" ON public.warehouse_receipt_lines;
CREATE POLICY "Managers can manage warehouse receipt lines"
ON public.warehouse_receipt_lines FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM warehouse_receipts wr
    JOIN warehouses w ON w.id = wr.warehouse_id
    WHERE wr.id = warehouse_receipt_lines.receipt_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM warehouse_receipts wr
    JOIN warehouses w ON w.id = wr.warehouse_id
    WHERE wr.id = warehouse_receipt_lines.receipt_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS Policies for Warehouse Transfers
DROP POLICY IF EXISTS "Users can view warehouse transfers in their organization" ON public.warehouse_transfers;
CREATE POLICY "Users can view warehouse transfers in their organization"
ON public.warehouse_transfers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_transfers.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
);

DROP POLICY IF EXISTS "Managers can manage warehouse transfers" ON public.warehouse_transfers;
CREATE POLICY "Managers can manage warehouse transfers"
ON public.warehouse_transfers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_transfers.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_transfers.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS Policies for Warehouse Transfer Lines
DROP POLICY IF EXISTS "Users can view warehouse transfer lines in their organization" ON public.warehouse_transfer_lines;
CREATE POLICY "Users can view warehouse transfer lines in their organization"
ON public.warehouse_transfer_lines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    JOIN warehouses w ON w.id = wt.warehouse_id
    WHERE wt.id = warehouse_transfer_lines.transfer_id 
    AND w.organization_id = get_current_user_organization_id()
  )
);

DROP POLICY IF EXISTS "Managers can manage warehouse transfer lines" ON public.warehouse_transfer_lines;
CREATE POLICY "Managers can manage warehouse transfer lines"
ON public.warehouse_transfer_lines FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    JOIN warehouses w ON w.id = wt.warehouse_id
    WHERE wt.id = warehouse_transfer_lines.transfer_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    JOIN warehouses w ON w.id = wt.warehouse_id
    WHERE wt.id = warehouse_transfer_lines.transfer_id 
    AND w.organization_id = get_current_user_organization_id()
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);