-- Clear Canyon warehouse data for fresh demo setup

-- Delete warehouse_items for the Canyon warehouse
DELETE FROM warehouse_items WHERE warehouse_id = 'b4211b1b-6fad-4004-bf26-631726ef8a4e';

-- Delete team inventory assignments for Canyon team
DELETE FROM team_inventory_assignments WHERE team_id = '75bddbb8-b044-4047-879c-26cad3cc2212';

-- Delete the Canyon warehouse
DELETE FROM warehouses WHERE id = 'b4211b1b-6fad-4004-bf26-631726ef8a4e';

-- Delete any inventory count records for the organization to reset demo state
DELETE FROM inventory_counts WHERE organization_id = (
  SELECT organization_id FROM teams WHERE id = '75bddbb8-b044-4047-879c-26cad3cc2212'
);