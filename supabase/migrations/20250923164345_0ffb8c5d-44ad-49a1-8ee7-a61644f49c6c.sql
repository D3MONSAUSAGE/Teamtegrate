-- Grant proper permissions on inventory_template_items table
GRANT INSERT, UPDATE, DELETE, SELECT ON inventory_template_items TO authenticated;
GRANT INSERT, UPDATE, DELETE, SELECT ON inventory_template_items TO anon;

-- Ensure proper permissions on related tables
GRANT INSERT, UPDATE, DELETE, SELECT ON inventory_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE, SELECT ON inventory_templates TO anon;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;