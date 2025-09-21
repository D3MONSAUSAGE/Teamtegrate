-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_threshold DECIMAL(10,2),
  maximum_threshold DECIMAL(10,2),
  reorder_point DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  supplier_info JSONB DEFAULT '{}',
  barcode TEXT,
  sku TEXT,
  location TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create inventory transactions table
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'count')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_number TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory counts table
CREATE TABLE public.inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  conducted_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory count items table  
CREATE TABLE public.inventory_count_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  expected_quantity DECIMAL(10,2) NOT NULL,
  actual_quantity DECIMAL(10,2),
  variance DECIMAL(10,2) GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
  notes TEXT,
  counted_by UUID,
  counted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(count_id, item_id)
);

-- Create inventory alerts table
CREATE TABLE public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'overstock', 'expired')),
  threshold_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
CREATE POLICY "Users can view inventory items in their organization"
  ON public.inventory_items FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can update inventory items"
  ON public.inventory_items FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- RLS Policies for inventory_transactions
CREATE POLICY "Users can view transactions in their organization"
  ON public.inventory_transactions FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create transactions"
  ON public.inventory_transactions FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    user_id = auth.uid()
  );

-- RLS Policies for inventory_counts
CREATE POLICY "Users can view counts in their organization"
  ON public.inventory_counts FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create counts"
  ON public.inventory_counts FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    conducted_by = auth.uid()
  );

CREATE POLICY "Users can update their own counts"
  ON public.inventory_counts FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    conducted_by = auth.uid()
  );

-- RLS Policies for inventory_count_items
CREATE POLICY "Users can view count items in their organization"
  ON public.inventory_count_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_counts 
      WHERE id = count_id 
      AND organization_id = get_current_user_organization_id()
    )
  );

CREATE POLICY "Users can manage count items for their counts"
  ON public.inventory_count_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_counts 
      WHERE id = count_id 
      AND organization_id = get_current_user_organization_id()
      AND conducted_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_counts 
      WHERE id = count_id 
      AND organization_id = get_current_user_organization_id()
      AND conducted_by = auth.uid()
    )
  );

-- RLS Policies for inventory_alerts
CREATE POLICY "Users can view alerts in their organization"
  ON public.inventory_alerts FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create alerts"
  ON public.inventory_alerts FOR INSERT
  WITH CHECK (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can resolve alerts"
  ON public.inventory_alerts FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- Create update trigger for inventory_items
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for inventory_counts
CREATE TRIGGER update_inventory_counts_updated_at
  BEFORE UPDATE ON public.inventory_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create alerts when stock thresholds are breached
CREATE OR REPLACE FUNCTION public.check_inventory_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for low stock alert
  IF NEW.minimum_threshold IS NOT NULL AND NEW.current_stock <= NEW.minimum_threshold THEN
    INSERT INTO public.inventory_alerts (
      organization_id, item_id, alert_type, threshold_value, current_value
    ) VALUES (
      NEW.organization_id, NEW.id, 'low_stock', NEW.minimum_threshold, NEW.current_stock
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for overstock alert
  IF NEW.maximum_threshold IS NOT NULL AND NEW.current_stock >= NEW.maximum_threshold THEN
    INSERT INTO public.inventory_alerts (
      organization_id, item_id, alert_type, threshold_value, current_value
    ) VALUES (
      NEW.organization_id, NEW.id, 'overstock', NEW.maximum_threshold, NEW.current_stock
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to check thresholds when stock is updated
CREATE TRIGGER check_inventory_thresholds_trigger
  AFTER UPDATE OF current_stock ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_inventory_thresholds();

-- Create function to update item stock based on transactions
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    UPDATE public.inventory_items 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.transaction_type = 'out' THEN
    UPDATE public.inventory_items 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE public.inventory_items 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update stock on transaction insert
CREATE TRIGGER update_inventory_stock_trigger
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_stock();