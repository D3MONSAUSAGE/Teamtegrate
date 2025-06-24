
-- Clean up any existing triggers and functions, then create new ones for the tasks table

-- Drop any existing triggers on tasks table
DROP TRIGGER IF EXISTS update_project_budget_spent_trigger ON public.tasks;
DROP TRIGGER IF EXISTS update_project_tasks_count_trigger ON public.tasks;

-- Drop the old function that might reference project_tasks
DROP FUNCTION IF EXISTS public.update_project_budget_spent_from_tasks();

-- Create/update the project budget calculation function to work with tasks table
CREATE OR REPLACE FUNCTION public.update_project_budget_spent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  old_cost DECIMAL(12,2) := 0;
  project_id_val TEXT;
BEGIN
  -- Handle both INSERT and UPDATE cases
  IF TG_OP = 'INSERT' THEN
    old_cost := 0;
    project_id_val := NEW.project_id;
  ELSIF TG_OP = 'UPDATE' THEN
    old_cost := COALESCE(OLD.cost, 0);
    project_id_val := NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    old_cost := COALESCE(OLD.cost, 0);
    project_id_val := OLD.project_id;
  END IF;

  -- Update the project budget_spent if there's a project associated with this task
  IF project_id_val IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN
      UPDATE public.projects
      SET budget_spent = COALESCE(budget_spent, 0) - old_cost
      WHERE id = project_id_val;
    ELSE
      UPDATE public.projects
      SET budget_spent = COALESCE(budget_spent, 0) - old_cost + COALESCE(NEW.cost, 0)
      WHERE id = project_id_val;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create trigger on tasks table for budget calculation
CREATE TRIGGER update_project_budget_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_budget_spent();

-- Update task count trigger function to work with tasks table
CREATE OR REPLACE FUNCTION public.update_project_tasks_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.project_id IS NOT NULL THEN
      UPDATE projects
      SET tasks_count = tasks_count + 1
      WHERE id = NEW.project_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.project_id IS NOT NULL THEN
      UPDATE projects
      SET tasks_count = tasks_count - 1
      WHERE id = OLD.project_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle project_id changes
    IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
      IF OLD.project_id IS NOT NULL THEN
        UPDATE projects
        SET tasks_count = tasks_count - 1
        WHERE id = OLD.project_id;
      END IF;
      IF NEW.project_id IS NOT NULL THEN
        UPDATE projects
        SET tasks_count = tasks_count + 1
        WHERE id = NEW.project_id;
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create trigger on tasks table for task count
CREATE TRIGGER update_project_tasks_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_tasks_count();
