-- Add template minimum and maximum quantity fields to inventory_count_items table
ALTER TABLE public.inventory_count_items 
ADD COLUMN template_minimum_quantity NUMERIC,
ADD COLUMN template_maximum_quantity NUMERIC;