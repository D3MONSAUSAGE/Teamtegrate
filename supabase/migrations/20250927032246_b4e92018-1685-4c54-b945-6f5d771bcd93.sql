-- Create inventory lots table for lot tracking
CREATE TABLE public.inventory_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  item_id UUID NOT NULL,
  lot_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiration_date DATE,
  quantity_received DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_remaining DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2),
  supplier_info JSONB DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutritional information table
CREATE TABLE public.inventory_nutritional_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  item_id UUID NOT NULL,
  serving_size TEXT,
  servings_per_container INTEGER,
  calories INTEGER,
  total_fat DECIMAL(5,2),
  saturated_fat DECIMAL(5,2),
  trans_fat DECIMAL(5,2),
  cholesterol DECIMAL(5,2),
  sodium DECIMAL(5,2),
  total_carbohydrates DECIMAL(5,2),
  dietary_fiber DECIMAL(5,2),
  total_sugars DECIMAL(5,2),
  added_sugars DECIMAL(5,2),
  protein DECIMAL(5,2),
  vitamin_d DECIMAL(5,2),
  calcium DECIMAL(5,2),
  iron DECIMAL(5,2),
  potassium DECIMAL(5,2),
  ingredients TEXT,
  allergens TEXT[],
  additional_nutrients JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id)
);

-- Create label templates table
CREATE TABLE public.label_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'product',
  template_data JSONB NOT NULL DEFAULT '{}',
  dimensions JSONB NOT NULL DEFAULT '{"width": 2, "height": 1, "unit": "inches"}',
  printer_type TEXT NOT NULL DEFAULT 'universal',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generated labels audit table
CREATE TABLE public.generated_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  template_id UUID NOT NULL,
  item_id UUID,
  lot_id UUID,
  label_data JSONB NOT NULL DEFAULT '{}',
  print_format TEXT NOT NULL DEFAULT 'pdf',
  quantity_printed INTEGER NOT NULL DEFAULT 1,
  printed_by UUID NOT NULL,
  printed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_nutritional_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_labels ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_lots
CREATE POLICY "Users can view lots in their organization" ON public.inventory_lots
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create lots in their organization" ON public.inventory_lots
  FOR INSERT WITH CHECK (organization_id = get_current_user_organization_id() AND created_by = auth.uid());

CREATE POLICY "Users can update lots in their organization" ON public.inventory_lots
  FOR UPDATE USING (organization_id = get_current_user_organization_id());

-- RLS policies for nutritional_info
CREATE POLICY "Users can view nutritional info in their organization" ON public.inventory_nutritional_info
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create nutritional info in their organization" ON public.inventory_nutritional_info
  FOR INSERT WITH CHECK (organization_id = get_current_user_organization_id() AND created_by = auth.uid());

CREATE POLICY "Users can update nutritional info in their organization" ON public.inventory_nutritional_info
  FOR UPDATE USING (organization_id = get_current_user_organization_id());

-- RLS policies for label_templates
CREATE POLICY "Users can view templates in their organization" ON public.label_templates
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage templates" ON public.label_templates
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- RLS policies for generated_labels
CREATE POLICY "Users can view generated labels in their organization" ON public.generated_labels
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create label records" ON public.generated_labels
  FOR INSERT WITH CHECK (organization_id = get_current_user_organization_id() AND printed_by = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_inventory_lots_item_id ON public.inventory_lots(item_id);
CREATE INDEX idx_inventory_lots_lot_number ON public.inventory_lots(lot_number);
CREATE INDEX idx_inventory_lots_expiration ON public.inventory_lots(expiration_date) WHERE is_active = true;
CREATE INDEX idx_nutritional_info_item_id ON public.inventory_nutritional_info(item_id);
CREATE INDEX idx_label_templates_category ON public.label_templates(category) WHERE is_active = true;
CREATE INDEX idx_generated_labels_printed_at ON public.generated_labels(printed_at);

-- Add triggers for updated_at
CREATE TRIGGER update_inventory_lots_updated_at
  BEFORE UPDATE ON public.inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutritional_info_updated_at
  BEFORE UPDATE ON public.inventory_nutritional_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_label_templates_updated_at
  BEFORE UPDATE ON public.label_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();