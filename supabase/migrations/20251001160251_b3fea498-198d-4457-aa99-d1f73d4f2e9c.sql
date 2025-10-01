-- Create atomic SKU generation function
CREATE OR REPLACE FUNCTION generate_next_sku(
  p_organization_id UUID,
  p_category_prefix TEXT DEFAULT 'GEN'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number INTEGER;
  v_new_sku TEXT;
  v_max_attempts INTEGER := 100;
  v_attempt INTEGER := 0;
BEGIN
  -- Find the highest number for this prefix in this organization
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(sku, '^' || p_category_prefix || '-?([0-9]+)$', '\1')
      AS INTEGER
    )
  ), 0) + 1
  INTO v_next_number
  FROM inventory_items
  WHERE organization_id = p_organization_id
    AND sku ~ ('^' || p_category_prefix || '-?[0-9]+$')
    AND is_active = true;
  
  -- Try to find an available SKU (handle race conditions)
  LOOP
    v_new_sku := p_category_prefix || '-' || LPAD(v_next_number::TEXT, 3, '0');
    
    -- Check if this SKU exists
    IF NOT EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE organization_id = p_organization_id 
        AND sku = v_new_sku 
        AND is_active = true
    ) THEN
      -- SKU is available
      RETURN v_new_sku;
    END IF;
    
    -- SKU exists, try next number
    v_next_number := v_next_number + 1;
    v_attempt := v_attempt + 1;
    
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique SKU after % attempts', v_max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Create SKU audit log table
CREATE TABLE IF NOT EXISTS inventory_sku_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  item_id UUID NOT NULL,
  old_sku TEXT,
  new_sku TEXT,
  action TEXT NOT NULL, -- 'created', 'modified', 'attempted_change'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies for audit log
ALTER TABLE inventory_sku_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SKU audit in their organization"
  ON inventory_sku_audit FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can insert SKU audit logs"
  ON inventory_sku_audit FOR INSERT
  WITH CHECK (true);

-- Create trigger to prevent SKU changes after initial assignment
CREATE OR REPLACE FUNCTION prevent_sku_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow setting SKU on creation (OLD.sku is NULL)
  IF OLD.sku IS NULL OR OLD.sku = '' THEN
    -- Log the SKU assignment
    INSERT INTO inventory_sku_audit (
      organization_id, item_id, old_sku, new_sku, action, user_id, metadata
    ) VALUES (
      NEW.organization_id, NEW.id, OLD.sku, NEW.sku, 'created', auth.uid(),
      jsonb_build_object('item_name', NEW.name)
    );
    RETURN NEW;
  END IF;
  
  -- If SKU is being changed (not just updated to same value)
  IF OLD.sku IS DISTINCT FROM NEW.sku THEN
    -- Log the attempted change
    INSERT INTO inventory_sku_audit (
      organization_id, item_id, old_sku, new_sku, action, user_id, metadata
    ) VALUES (
      NEW.organization_id, NEW.id, OLD.sku, NEW.sku, 'attempted_change', auth.uid(),
      jsonb_build_object(
        'item_name', NEW.name,
        'blocked', true,
        'reason', 'SKU cannot be modified after initial assignment'
      )
    );
    
    -- Prevent the change by raising an exception
    RAISE EXCEPTION 'SKU cannot be modified after initial assignment. Current SKU: %, Attempted: %', OLD.sku, NEW.sku
      USING HINT = 'SKUs are permanent identifiers and cannot be changed once assigned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS prevent_sku_modification_trigger ON inventory_items;

-- Create the trigger
CREATE TRIGGER prevent_sku_modification_trigger
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sku_modification();

-- Create index on audit log for performance
CREATE INDEX IF NOT EXISTS idx_sku_audit_item_id ON inventory_sku_audit(item_id);
CREATE INDEX IF NOT EXISTS idx_sku_audit_created_at ON inventory_sku_audit(created_at DESC);