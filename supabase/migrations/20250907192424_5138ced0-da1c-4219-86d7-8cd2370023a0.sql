-- Demote Josue Robledo from superadmin to admin in users table
-- Target user located by id from prior lookup
UPDATE public.users
SET role = 'admin'
WHERE id = 'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931';