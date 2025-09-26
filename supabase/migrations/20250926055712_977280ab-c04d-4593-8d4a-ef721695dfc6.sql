-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Users can view vendors in their organization" ON public.vendors
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create vendors" ON public.vendors
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can update vendors" ON public.vendors
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can delete vendors" ON public.vendors
  FOR DELETE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- Add vendor_id to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id);

-- Create index for better performance
CREATE INDEX idx_inventory_items_vendor_id ON public.inventory_items(vendor_id);
CREATE INDEX idx_vendors_organization_id ON public.vendors(organization_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();