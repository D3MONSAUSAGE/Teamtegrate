-- Remove admin/superadmin users from non-Corp teams
-- Corp team ID: 59745b20-e6f1-4309-8e98-14444a009676
DELETE FROM public.team_memberships
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE role IN ('admin', 'superadmin')
)
AND team_id != '59745b20-e6f1-4309-8e98-14444a009676';