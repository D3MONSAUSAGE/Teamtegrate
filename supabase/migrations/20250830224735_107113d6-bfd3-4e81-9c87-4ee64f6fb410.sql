
-- 1) Show current state (for transparency)
SELECT id, email, name, role, organization_id
FROM public.users
WHERE id IN (
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931', -- Josue
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d'  -- General Manager (should remain superadmin)
);

-- 2) Demote Josue from superadmin to admin in the same organization
UPDATE public.users
SET role = 'admin'
WHERE id = 'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931'
  AND organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
  AND role = 'superadmin';

-- 3) Verify the change
SELECT id, email, name, role
FROM public.users
WHERE id IN (
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d'
);

-- 4) Confirm only one superadmin remains in the org
SELECT organization_id, COUNT(*) AS superadmin_count
FROM public.users
WHERE organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
  AND role = 'superadmin'
GROUP BY organization_id;

-- 5) Enforce "one superadmin per organization" at the database level
--    This creates a partial unique index for rows where role = 'superadmin'
CREATE UNIQUE INDEX IF NOT EXISTS uniq_one_superadmin_per_org
ON public.users (organization_id)
WHERE role = 'superadmin';
