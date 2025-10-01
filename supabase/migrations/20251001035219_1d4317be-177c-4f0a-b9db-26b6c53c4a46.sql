-- Create manufacturing_batches table for tracking production runs
CREATE TABLE IF NOT EXISTS public.manufacturing_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  lot_id UUID REFERENCES public.inventory_lots(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  total_quantity_manufactured NUMERIC NOT NULL DEFAULT 0,
  quantity_labeled NUMERIC NOT NULL DEFAULT 0,
  quantity_distributed NUMERIC NOT NULL DEFAULT 0,
  quantity_remaining NUMERIC NOT NULL DEFAULT 0,
  manufacturing_date DATE NOT NULL,
  manufacturing_shift TEXT,
  production_line TEXT,
  production_notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, batch_number)
);

-- Create product_distributions table for tracking outbound shipments
CREATE TABLE IF NOT EXISTS public.product_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  batch_id UUID REFERENCES public.manufacturing_batches(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.inventory_lots(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  destination_location TEXT,
  quantity_shipped NUMERIC NOT NULL,
  shipment_date DATE NOT NULL,
  tracking_number TEXT,
  sales_order_reference TEXT,
  delivery_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recall_notices table for managing product recalls
CREATE TABLE IF NOT EXISTS public.recall_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  recall_number TEXT NOT NULL,
  lot_ids UUID[] NOT NULL,
  batch_ids UUID[],
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'initiated',
  affected_quantity NUMERIC NOT NULL DEFAULT 0,
  date_initiated DATE NOT NULL DEFAULT CURRENT_DATE,
  date_completed DATE,
  regulatory_agency TEXT,
  action_required TEXT NOT NULL,
  contact_instructions TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, recall_number)
);

-- Enable RLS
ALTER TABLE public.manufacturing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manufacturing_batches
CREATE POLICY "Users can view batches in their organization"
  ON public.manufacturing_batches FOR SELECT
  USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can create batches in their organization"
  ON public.manufacturing_batches FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_user_organization_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update batches in their organization"
  ON public.manufacturing_batches FOR UPDATE
  USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Admins can delete batches"
  ON public.manufacturing_batches FOR DELETE
  USING (
    organization_id = public.get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for product_distributions
CREATE POLICY "Users can view distributions in their organization"
  ON public.product_distributions FOR SELECT
  USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can create distributions in their organization"
  ON public.product_distributions FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_user_organization_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update distributions in their organization"
  ON public.product_distributions FOR UPDATE
  USING (organization_id = public.get_current_user_organization_id());

-- RLS Policies for recall_notices
CREATE POLICY "Users can view recalls in their organization"
  ON public.recall_notices FOR SELECT
  USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Managers can create recalls"
  ON public.recall_notices FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_user_organization_id() AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can update recalls"
  ON public.recall_notices FOR UPDATE
  USING (
    organization_id = public.get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_manufacturing_batches_org ON public.manufacturing_batches(organization_id);
CREATE INDEX idx_manufacturing_batches_lot ON public.manufacturing_batches(lot_id);
CREATE INDEX idx_manufacturing_batches_date ON public.manufacturing_batches(manufacturing_date);

CREATE INDEX idx_product_distributions_org ON public.product_distributions(organization_id);
CREATE INDEX idx_product_distributions_batch ON public.product_distributions(batch_id);
CREATE INDEX idx_product_distributions_lot ON public.product_distributions(lot_id);
CREATE INDEX idx_product_distributions_date ON public.product_distributions(shipment_date);

CREATE INDEX idx_recall_notices_org ON public.recall_notices(organization_id);
CREATE INDEX idx_recall_notices_status ON public.recall_notices(status);
CREATE INDEX idx_recall_notices_lot_ids ON public.recall_notices USING GIN(lot_ids);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_manufacturing_batches_updated_at
  BEFORE UPDATE ON public.manufacturing_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recall_notices_updated_at
  BEFORE UPDATE ON public.recall_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update batch quantities when distributions are created
CREATE OR REPLACE FUNCTION update_batch_quantities_on_distribution()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.manufacturing_batches
  SET 
    quantity_distributed = quantity_distributed + NEW.quantity_shipped,
    quantity_remaining = total_quantity_manufactured - (quantity_distributed + NEW.quantity_shipped),
    updated_at = now()
  WHERE id = NEW.batch_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_batch_on_distribution
  AFTER INSERT ON public.product_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_quantities_on_distribution();