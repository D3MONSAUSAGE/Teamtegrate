-- Add measurement_type field to inventory_units table
ALTER TABLE public.inventory_units 
ADD COLUMN measurement_type TEXT;