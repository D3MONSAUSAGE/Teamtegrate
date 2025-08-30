
-- 0) Context: current superadmins in your org
SELECT id, email, name, role
FROM public.users
WHERE organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
  AND role = 'superadmin';

-- 1) Demote Josue Robledo to admin
UPDATE public.users
SET role = 'admin'
WHERE id = 'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931'
  AND organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
  AND role = 'superadmin';

-- 2) Verify both users' roles after demotion
SELECT id, email, name, role
FROM public.users
WHERE id IN (
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931', -- Josue
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d'  -- General Manager (should remain superadmin)
);

-- 3) Enforce one superadmin per organization going forward
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND indexname = 'uniq_one_superadmin_per_org'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_one_superadmin_per_org
             ON public.users (organization_id)
             WHERE role = ''superadmin''';
  END IF;
END $$;

-- 4) Confirm index presence and final counts
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND indexname = 'uniq_one_superadmin_per_org';

SELECT organization_id, COUNT(*) AS superadmin_count
FROM public.users
WHERE role = 'superadmin'
GROUP BY organization_id;
