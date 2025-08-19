-- Create sales_data table to persist uploaded sales reports
CREATE TABLE public.sales_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  date date NOT NULL,
  location text NOT NULL,
  gross_sales numeric NOT NULL DEFAULT 0,
  net_sales numeric NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  order_average numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  labor_hours numeric NOT NULL DEFAULT 0,
  labor_percentage numeric NOT NULL DEFAULT 0,
  sales_per_labor_hour numeric NOT NULL DEFAULT 0,
  non_cash numeric NOT NULL DEFAULT 0,
  total_cash numeric NOT NULL DEFAULT 0,
  calculated_cash numeric NOT NULL DEFAULT 0,
  tips numeric NOT NULL DEFAULT 0,
  voids numeric DEFAULT 0,
  refunds numeric DEFAULT 0,
  surcharges numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  raw_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view sales data in their organization"
  ON public.sales_data
  FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can insert sales data to their organization"
  ON public.sales_data
  FOR INSERT
  WITH CHECK (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own sales data"
  ON public.sales_data
  FOR UPDATE
  USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete their own sales data"
  ON public.sales_data
  FOR DELETE
  USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

-- Create index for common queries
CREATE INDEX idx_sales_data_org_date ON public.sales_data(organization_id, date);
CREATE INDEX idx_sales_data_user_date ON public.sales_data(user_id, date);

-- Create trigger for updated_at
CREATE TRIGGER update_sales_data_updated_at
  BEFORE UPDATE ON public.sales_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();