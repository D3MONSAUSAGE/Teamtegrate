-- Add approval workflow fields to inventory counts
ALTER TABLE public.inventory_counts 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval' CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS warehouse_updated BOOLEAN DEFAULT FALSE;

-- Add warehouse stock adjustment tracking
CREATE TABLE IF NOT EXISTS public.warehouse_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  warehouse_id UUID,
  item_id UUID NOT NULL,
  count_id UUID REFERENCES public.inventory_counts(id),
  previous_quantity DECIMAL(10,2) NOT NULL,
  new_quantity DECIMAL(10,2) NOT NULL,
  adjustment_amount DECIMAL(10,2) NOT NULL,
  adjustment_reason TEXT DEFAULT 'inventory_count_approval',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on warehouse stock adjustments
ALTER TABLE public.warehouse_stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warehouse stock adjustments
CREATE POLICY "Users can view adjustments in their organization" ON public.warehouse_stock_adjustments
FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create adjustments" ON public.warehouse_stock_adjustments
FOR INSERT WITH CHECK (organization_id = get_current_user_organization_id());

-- Add function to sync template min/max to warehouse
CREATE OR REPLACE FUNCTION sync_template_minmax_to_warehouse()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing warehouse items with template min/max
  UPDATE public.inventory_warehouse_items 
  SET 
    reorder_point = NEW.minimum_quantity,
    max_stock_level = NEW.maximum_quantity,
    updated_at = NOW()
  WHERE item_id = NEW.item_id
    AND EXISTS (
      SELECT 1 FROM public.team_inventory_assignments tia
      WHERE tia.template_id = NEW.template_id
      AND tia.is_active = true
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync template changes to warehouse
DROP TRIGGER IF EXISTS sync_template_to_warehouse_trigger ON public.inventory_template_items;
CREATE TRIGGER sync_template_to_warehouse_trigger
  AFTER UPDATE OF minimum_quantity, maximum_quantity ON public.inventory_template_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_template_minmax_to_warehouse();

-- Add function to send count approval notifications
CREATE OR REPLACE FUNCTION notify_count_approval_required()
RETURNS TRIGGER AS $$
DECLARE
  team_manager_id UUID;
  admin_ids UUID[];
BEGIN
  -- Only send notifications when count status changes to completed and needs approval
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.approval_status = 'pending_approval' THEN
    
    -- Get team manager if template is assigned to a team
    SELECT t.manager_id::UUID INTO team_manager_id
    FROM public.teams t
    JOIN public.team_inventory_assignments tia ON t.id = tia.team_id
    WHERE tia.template_id = NEW.template_id
      AND tia.is_active = true
      AND t.manager_id IS NOT NULL
    LIMIT 1;
    
    -- Send notification to team manager
    IF team_manager_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, organization_id, title, content, type, created_at
      ) VALUES (
        team_manager_id,
        NEW.organization_id,
        'Inventory Count Pending Approval',
        'Inventory count requires your approval to update warehouse quantities.',
        'count_approval',
        NOW()
      );
    END IF;
    
    -- Get all admin/superadmin users in the organization
    SELECT ARRAY_AGG(id) INTO admin_ids
    FROM public.users 
    WHERE organization_id = NEW.organization_id 
      AND role IN ('admin', 'superadmin');
    
    -- Send notifications to admins as backup
    IF admin_ids IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, organization_id, title, content, type, created_at
      )
      SELECT 
        UNNEST(admin_ids),
        NEW.organization_id,
        'Inventory Count Pending Approval',
        'Inventory count requires approval to update warehouse quantities.',
        'count_approval',
        NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for count approval notifications
DROP TRIGGER IF EXISTS count_approval_notification_trigger ON public.inventory_counts;
CREATE TRIGGER count_approval_notification_trigger
  AFTER UPDATE OF status, approval_status ON public.inventory_counts
  FOR EACH ROW
  EXECUTE FUNCTION notify_count_approval_required();