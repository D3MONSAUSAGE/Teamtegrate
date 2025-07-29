-- Fix budget calculation issue: Remove duplicate triggers and correct corrupted data

-- First, check what triggers exist on tasks table
SELECT tgname, tgrelid::regclass, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.tasks'::regclass 
AND tgname NOT LIKE 'RI_%';  -- Exclude foreign key triggers

-- Drop duplicate triggers that are causing 3x inflation
DROP TRIGGER IF EXISTS task_cost_changes ON public.tasks;
DROP TRIGGER IF EXISTS remove_cost_on_task_delete ON public.tasks;

-- Keep only these triggers (they should already exist and work correctly):
-- - update_project_budget_after_task_change (for INSERT/UPDATE)
-- - task_deletion or similar (for DELETE)

-- Fix the corrupted budget_spent data for "Breakfast Menu Las Originales" project
-- First calculate the correct amount
UPDATE public.projects 
SET budget_spent = (
  SELECT COALESCE(SUM(cost), 0) 
  FROM public.tasks 
  WHERE project_id = '82e675e8-c2a8-4be0-9122-dc66c6d5555c'
)
WHERE id = '82e675e8-c2a8-4be0-9122-dc66c6d5555c';

-- Verify the fix
SELECT 
  p.title,
  p.budget,
  p.budget_spent,
  (SELECT COALESCE(SUM(t.cost), 0) FROM tasks t WHERE t.project_id = p.id) as actual_task_costs,
  ROUND((p.budget_spent / p.budget) * 100, 2) as percentage_spent
FROM public.projects p 
WHERE p.id = '82e675e8-c2a8-4be0-9122-dc66c6d5555c';