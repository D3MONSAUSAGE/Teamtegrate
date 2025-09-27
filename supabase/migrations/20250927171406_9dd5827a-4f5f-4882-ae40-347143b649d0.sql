-- Add image_url column to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN image_url TEXT;