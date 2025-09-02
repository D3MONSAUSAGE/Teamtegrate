-- Create sales channels table for third-party platforms
CREATE TABLE public.sales_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0, -- e.g., 0.15 for 15%
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'flat_fee')),
  flat_fee_amount NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  location TEXT, -- Optional location filter
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create sales channel transactions table to track daily sales by channel
CREATE TABLE public.sales_channel_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  sales_data_id TEXT NOT NULL, -- References sales_data.id
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  gross_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_sales_channels_org_active ON public.sales_channels(organization_id, is_active);
CREATE INDEX idx_sales_channel_transactions_org_date ON public.sales_channel_transactions(organization_id, date);
CREATE INDEX idx_sales_channel_transactions_channel_date ON public.sales_channel_transactions(channel_id, date);

-- Enable RLS
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_channel_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_channels
CREATE POLICY "Users can view channels in their organization" 
ON public.sales_channels 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create channels" 
ON public.sales_channels 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

CREATE POLICY "Managers can update channels" 
ON public.sales_channels 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

CREATE POLICY "Managers can delete channels" 
ON public.sales_channels 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- RLS policies for sales_channel_transactions
CREATE POLICY "Users can view channel transactions in their organization" 
ON public.sales_channel_transactions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create channel transactions in their organization" 
ON public.sales_channel_transactions 
FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can update channel transactions in their organization" 
ON public.sales_channel_transactions 
FOR UPDATE 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can delete channel transactions" 
ON public.sales_channel_transactions 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_sales_channels_updated_at
  BEFORE UPDATE ON public.sales_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_channel_transactions_updated_at
  BEFORE UPDATE ON public.sales_channel_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();