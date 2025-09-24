-- Add void functionality to inventory_counts table
ALTER TABLE public.inventory_counts 
ADD COLUMN is_voided boolean NOT NULL DEFAULT false,
ADD COLUMN voided_by uuid REFERENCES public.users(id),
ADD COLUMN voided_at timestamp with time zone,
ADD COLUMN void_reason text;

-- Create RLS policy for superadmins to void inventory counts
CREATE POLICY "Superadmins can void inventory counts" 
ON public.inventory_counts 
FOR UPDATE 
USING (
  (organization_id = get_current_user_organization_id()) 
  AND (get_current_user_role() = 'superadmin')
  AND (is_voided = false)  -- Can only void non-voided counts
)
WITH CHECK (
  (organization_id = get_current_user_organization_id()) 
  AND (get_current_user_role() = 'superadmin')
);

-- Create index for better performance on voided queries
CREATE INDEX idx_inventory_counts_voided ON public.inventory_counts(is_voided, organization_id) WHERE is_voided = false;