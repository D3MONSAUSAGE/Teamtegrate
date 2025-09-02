-- Convert sales channels from location-based to team-based

-- Add team_id to sales_channels if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales_channels' 
                 AND column_name = 'team_id') THEN
    ALTER TABLE public.sales_channels 
    ADD COLUMN team_id UUID REFERENCES public.teams(id);
  END IF;
END $$;

-- Add team_id to sales_channel_transactions if not exists  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales_channel_transactions' 
                 AND column_name = 'team_id') THEN
    ALTER TABLE public.sales_channel_transactions
    ADD COLUMN team_id UUID REFERENCES public.teams(id);
  END IF;
END $$;

-- Make location optional in sales_channels for migration
ALTER TABLE public.sales_channels 
ALTER COLUMN location DROP NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_channels_team_id ON public.sales_channels(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_channel_transactions_team_id ON public.sales_channel_transactions(team_id);

-- Update RLS policies for team-based access
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