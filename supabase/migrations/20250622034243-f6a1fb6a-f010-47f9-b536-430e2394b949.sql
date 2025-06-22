
-- Phase 1: Remove branch_budgets table and its constraints
DROP TABLE IF EXISTS public.branch_budgets CASCADE;

-- Phase 2: Remove branches table and its constraints  
DROP TABLE IF EXISTS public.branches CASCADE;

-- Phase 3: Clean up any remaining references in functions
-- Update any functions that might reference these tables
-- (The migration we ran earlier should have already cleaned up the main references)

-- Verify cleanup - list remaining tables to confirm branches and branch_budgets are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('branches', 'branch_budgets')
ORDER BY table_name;
