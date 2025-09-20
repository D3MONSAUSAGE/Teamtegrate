-- Add subcategory support to request_types table
ALTER TABLE public.request_types 
ADD COLUMN subcategory text,
ADD COLUMN parent_category_id uuid REFERENCES public.request_types(id);

-- Remove unwanted assignment configuration fields
ALTER TABLE public.request_types 
DROP COLUMN IF EXISTS geographic_scope,
DROP COLUMN IF EXISTS workload_balancing_enabled,
DROP COLUMN IF EXISTS assignment_strategy;

-- Create index for subcategory hierarchy queries
CREATE INDEX idx_request_types_parent_category ON public.request_types(parent_category_id);

-- Update existing data to set proper category structure
-- All existing request types become main categories (parent_category_id = null)
UPDATE public.request_types SET parent_category_id = NULL WHERE parent_category_id IS NOT NULL;