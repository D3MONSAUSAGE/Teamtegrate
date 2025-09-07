-- Use security-definer function to demote Josue to admin while keeping existing superadmin
SELECT public.transfer_superadmin_role(
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931'::uuid,  -- current superadmin (Josue)
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d'::uuid,  -- existing superadmin (Francisco)
  'a15218f7-9da3-440a-a985-2c65bcb86a08'::uuid   -- organization id
) AS result;