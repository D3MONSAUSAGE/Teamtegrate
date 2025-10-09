-- Function to auto-create warehouse for new teams
CREATE OR REPLACE FUNCTION auto_create_team_warehouse()
RETURNS TRIGGER AS $$
BEGIN
  -- Create warehouse with team name automatically
  INSERT INTO warehouses (
    organization_id,
    name,
    team_id,
    created_by,
    created_at
  ) VALUES (
    NEW.organization_id,
    NEW.name || ' Warehouse',
    NEW.id,
    COALESCE(NEW.manager_id, (SELECT id FROM users WHERE organization_id = NEW.organization_id AND role IN ('admin', 'superadmin') LIMIT 1)),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on teams table to auto-create warehouses
CREATE TRIGGER create_warehouse_for_new_team
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_team_warehouse();

-- Backfill: Create warehouses for existing teams that don't have one
INSERT INTO warehouses (organization_id, name, team_id, created_by, created_at)
SELECT 
  t.organization_id,
  t.name || ' Warehouse' as name,
  t.id as team_id,
  COALESCE(t.manager_id, (SELECT id FROM users WHERE organization_id = t.organization_id AND role IN ('admin', 'superadmin') LIMIT 1)) as created_by,
  NOW() as created_at
FROM teams t
WHERE t.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.team_id = t.id
  );