-- Clear all warehouse data to start fresh

-- Delete warehouse transfer lines first (dependent on transfers)
DELETE FROM warehouse_transfer_lines;

-- Delete warehouse stock adjustments
DELETE FROM warehouse_stock_adjustments;

-- Delete warehouse items (items stored in warehouses)
DELETE FROM warehouse_items;

-- Delete inventory warehouse items (warehouse-item relationships)
DELETE FROM inventory_warehouse_items;

-- Delete warehouse item settings
DELETE FROM warehouse_item_settings;

-- Delete warehouse transfers
DELETE FROM warehouse_transfers;

-- Finally delete warehouses themselves
DELETE FROM warehouses;