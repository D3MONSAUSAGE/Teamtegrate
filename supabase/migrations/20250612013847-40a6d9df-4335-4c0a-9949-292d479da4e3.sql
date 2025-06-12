
-- Rename "Legacy Org" to "Legacy Organization" to align naming conventions
UPDATE public.organizations 
SET name = 'Legacy Organization'
WHERE name = 'Legacy Org';
