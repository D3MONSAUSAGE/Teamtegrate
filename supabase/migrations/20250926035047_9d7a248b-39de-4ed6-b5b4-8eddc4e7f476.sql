-- Add team_id column to inventory_items table for team-based inventory management
ALTER TABLE public.inventory_items 
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Create index for better performance on team-based queries
CREATE INDEX idx_inventory_items_team_id ON public.inventory_items(team_id);

-- Set all existing inventory items to be available to all teams (team_id = NULL means available to all teams)
-- This ensures backward compatibility while enabling the new team-based system
UPDATE public.inventory_items 
SET team_id = NULL 
WHERE team_id IS NULL;

-- Add comment to document the team_id behavior
COMMENT ON COLUMN public.inventory_items.team_id IS 'NULL means item is available to all teams in the organization';