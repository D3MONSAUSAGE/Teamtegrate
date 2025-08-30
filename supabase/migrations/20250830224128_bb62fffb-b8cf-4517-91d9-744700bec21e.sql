
-- Demote Josue Robledo from superadmin to admin in his organization
-- Org: a15218f7-9da3-440a-a985-2c65bcb86a08
-- Josue: e158e6d9-3ba7-4dbb-84b5-1ec0110d3931
-- General Manager (kept as superadmin): 3cb3ba4f-0ae9-4906-bd68-7d02f687c82d

-- 1) Update Josue's role if he is superadmin in the specified org
UPDATE public.users
SET role = 'admin'
WHERE id = 'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931'
  AND organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
  AND role = 'superadmin';

-- 2) Verify both target users' roles after the change
SELECT id, email, name, role
FROM public.users
WHERE id IN (
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931', -- Josue
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d'  -- General Manager
);

-- 3) Verify there is now only one superadmin in the organization
SELECT COUNT(*) AS superadmin_count_in_org
FROM public.users
WHERE organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
  AND role = 'superadmin';
