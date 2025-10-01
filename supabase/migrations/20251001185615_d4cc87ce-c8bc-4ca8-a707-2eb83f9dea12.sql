-- Remove the overly permissive SELECT policy that shows all items in organization
DROP POLICY IF EXISTS "Users can view inventory items in their organization" ON public.inventory_items;

-- Keep only the team-isolated SELECT policy
-- This ensures:
-- 1. Admins/superadmins see all items in their org
-- 2. Regular users only see items from teams they're members of
-- The policy "Users can view their team items or admins see all" already exists and provides proper isolation