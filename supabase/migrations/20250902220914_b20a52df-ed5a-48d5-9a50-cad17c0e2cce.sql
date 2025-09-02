-- Convert finance system from location-based to team-based

-- Update sales_channels table
ALTER TABLE public.sales_channels 
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Update sales_channel_transactions table  
ALTER TABLE public.sales_channel_transactions
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Remove location column from sales_channels (make optional first for migration)
ALTER TABLE public.sales_channels 
ALTER COLUMN location DROP NOT NULL;

-- Update sales_data table to use team_id instead of location
ALTER TABLE public.sales_data
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Update petty_cash_transactions table
ALTER TABLE public.petty_cash_transactions
ALTER COLUMN team_id SET NOT NULL;

-- Update transactions table (already has team_id, ensure it's used)
-- No changes needed for transactions table as it already has team_id

-- Create indexes for performance
CREATE INDEX idx_sales_channels_team_id ON public.sales_channels(team_id);
CREATE INDEX idx_sales_channel_transactions_team_id ON public.sales_channel_transactions(team_id);
CREATE INDEX idx_sales_data_team_id ON public.sales_data(team_id);

-- Update RLS policies to work with team-based access
DROP POLICY IF EXISTS "Users can view channels in their organization" ON public.sales_channels;
CREATE POLICY "Users can view channels in their organization"
ON public.sales_channels FOR SELECT
USING (
  organization_id = get_current_user_organization_id() AND
  (team_id IS NULL OR team_id IN (
    SELECT tm.team_id FROM team_memberships tm WHERE tm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'superadmin')
  ))
);

DROP POLICY IF EXISTS "Users can create channels in their organization" ON public.sales_channels;
CREATE POLICY "Users can create channels in their organization"  
ON public.sales_channels FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  (team_id IS NULL OR team_id IN (
    SELECT tm.team_id FROM team_memberships tm WHERE tm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'superadmin', 'manager')
  ))
);

DROP POLICY IF EXISTS "Users can update channels in their organization" ON public.sales_channels;
CREATE POLICY "Users can update channels in their organization"
ON public.sales_channels FOR UPDATE  
USING (
  organization_id = get_current_user_organization_id() AND
  (team_id IS NULL OR team_id IN (
    SELECT tm.team_id FROM team_memberships tm WHERE tm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'superadmin', 'manager')
  ))
);

DROP POLICY IF EXISTS "Users can delete channels in their organization" ON public.sales_channels;
CREATE POLICY "Users can delete channels in their organization"
ON public.sales_channels FOR DELETE
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'superadmin')
  )
);