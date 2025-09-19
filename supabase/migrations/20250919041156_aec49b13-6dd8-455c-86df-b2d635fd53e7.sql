-- Phase 1: Task Assignment Consolidation - Database Cleanup and Enhancement

-- First, let's clean up existing data inconsistencies
-- Fix tasks that have both single and multi-assignments set incorrectly
UPDATE tasks 
SET assigned_to_id = NULL 
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) > 1 
  AND assigned_to_id IS NOT NULL;

-- Clean up empty strings in assigned_to_ids arrays
UPDATE tasks 
SET assigned_to_ids = ARRAY(
  SELECT unnest(assigned_to_ids) 
  WHERE unnest(assigned_to_ids) != '' 
    AND unnest(assigned_to_ids) IS NOT NULL
)
WHERE assigned_to_ids IS NOT NULL;

-- Clean up empty strings in assigned_to_names arrays  
UPDATE tasks 
SET assigned_to_names = ARRAY(
  SELECT unnest(assigned_to_names) 
  WHERE unnest(assigned_to_names) != '' 
    AND unnest(assigned_to_names) IS NOT NULL
)
WHERE assigned_to_names IS NOT NULL;

-- Ensure array consistency - assigned_to_ids and assigned_to_names should have same length
UPDATE tasks 
SET assigned_to_names = assigned_to_names[1:array_length(assigned_to_ids, 1)]
WHERE assigned_to_ids IS NOT NULL 
  AND assigned_to_names IS NOT NULL 
  AND array_length(assigned_to_ids, 1) != array_length(assigned_to_names, 1);

-- Set single assignment fields for tasks with exactly one assignee
UPDATE tasks 
SET assigned_to_id = assigned_to_ids[1],
    assigned_to_name = assigned_to_names[1]
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) = 1 
  AND (assigned_to_id IS NULL OR assigned_to_id != assigned_to_ids[1]);

-- Clear single assignment fields for tasks with multiple assignees  
UPDATE tasks 
SET assigned_to_id = NULL,
    assigned_to_name = NULL
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) > 1 
  AND (assigned_to_id IS NOT NULL OR assigned_to_name IS NOT NULL);

-- Add new columns for team assignments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_team_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_team_name TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'individual' CHECK (assignment_type IN ('individual', 'team', 'project_team'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_source TEXT DEFAULT 'manual' CHECK (assignment_source IN ('manual', 'inherited', 'auto_distributed'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_team_id ON tasks(assigned_to_team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignment_type ON tasks(assignment_type);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_ids ON tasks USING GIN(assigned_to_ids);

-- Create audit log table for assignment changes
CREATE TABLE IF NOT EXISTS task_assignment_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    organization_id UUID NOT NULL,
    changed_by UUID NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('assign', 'unassign', 'reassign', 'team_assign', 'bulk_assign')),
    previous_assignment JSONB,
    new_assignment JSONB,
    assignment_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE task_assignment_audit ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit table
CREATE POLICY "Users can view assignment audit in their organization" ON task_assignment_audit
    FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create assignment audit in their organization" ON task_assignment_audit
    FOR INSERT WITH CHECK (organization_id = get_current_user_organization_id() AND changed_by = auth.uid());

-- Create function to log assignment changes
CREATE OR REPLACE FUNCTION log_task_assignment_change(
    p_task_id TEXT,
    p_organization_id UUID,
    p_change_type TEXT,
    p_previous_assignment JSONB,
    p_new_assignment JSONB,
    p_assignment_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO task_assignment_audit (
        task_id, organization_id, changed_by, change_type,
        previous_assignment, new_assignment, assignment_reason
    ) VALUES (
        p_task_id, p_organization_id, auth.uid(), p_change_type,
        p_previous_assignment, p_new_assignment, p_assignment_reason
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- Create trigger to automatically log assignment changes
CREATE OR REPLACE FUNCTION trigger_log_task_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    old_assignment JSONB;
    new_assignment JSONB;
    change_type TEXT;
BEGIN
    -- Build old assignment data
    old_assignment := jsonb_build_object(
        'assigned_to_id', OLD.assigned_to_id,
        'assigned_to_name', OLD.assigned_to_name,
        'assigned_to_ids', OLD.assigned_to_ids,
        'assigned_to_names', OLD.assigned_to_names,
        'assigned_to_team_id', OLD.assigned_to_team_id,
        'assigned_to_team_name', OLD.assigned_to_team_name,
        'assignment_type', OLD.assignment_type
    );
    
    -- Build new assignment data
    new_assignment := jsonb_build_object(
        'assigned_to_id', NEW.assigned_to_id,
        'assigned_to_name', NEW.assigned_to_name,
        'assigned_to_ids', NEW.assigned_to_ids,
        'assigned_to_names', NEW.assigned_to_names,
        'assigned_to_team_id', NEW.assigned_to_team_id,
        'assigned_to_team_name', NEW.assigned_to_team_name,
        'assignment_type', NEW.assignment_type
    );
    
    -- Determine change type
    IF OLD.assigned_to_ids IS NULL AND NEW.assigned_to_ids IS NOT NULL AND array_length(NEW.assigned_to_ids, 1) > 0 THEN
        change_type := 'assign';
    ELSIF OLD.assigned_to_ids IS NOT NULL AND array_length(OLD.assigned_to_ids, 1) > 0 AND (NEW.assigned_to_ids IS NULL OR array_length(NEW.assigned_to_ids, 1) = 0) THEN
        change_type := 'unassign';
    ELSE
        change_type := 'reassign';
    END IF;
    
    -- Log the change if there's actually a change in assignments
    IF old_assignment != new_assignment THEN
        PERFORM log_task_assignment_change(
            NEW.id,
            NEW.organization_id,
            change_type,
            old_assignment,
            new_assignment,
            'Automatic logging'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS log_task_assignment_changes ON tasks;
CREATE TRIGGER log_task_assignment_changes
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_task_assignment_change();

-- Create function to validate assignment consistency
CREATE OR REPLACE FUNCTION validate_task_assignment_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure assignment type matches the actual assignment data
    IF NEW.assigned_to_team_id IS NOT NULL THEN
        NEW.assignment_type := 'team';
    ELSIF NEW.assigned_to_ids IS NOT NULL AND array_length(NEW.assigned_to_ids, 1) > 0 THEN
        NEW.assignment_type := 'individual';
    ELSE
        NEW.assignment_type := 'individual';
    END IF;
    
    -- Ensure single assignment consistency
    IF NEW.assigned_to_ids IS NOT NULL AND array_length(NEW.assigned_to_ids, 1) = 1 THEN
        NEW.assigned_to_id := NEW.assigned_to_ids[1];
        IF NEW.assigned_to_names IS NOT NULL AND array_length(NEW.assigned_to_names, 1) >= 1 THEN
            NEW.assigned_to_name := NEW.assigned_to_names[1];
        END IF;
    ELSIF NEW.assigned_to_ids IS NOT NULL AND array_length(NEW.assigned_to_ids, 1) > 1 THEN
        NEW.assigned_to_id := NULL;
        NEW.assigned_to_name := NULL;
    END IF;
    
    -- Clean up empty arrays
    IF NEW.assigned_to_ids IS NOT NULL AND array_length(NEW.assigned_to_ids, 1) = 0 THEN
        NEW.assigned_to_ids := NULL;
    END IF;
    
    IF NEW.assigned_to_names IS NOT NULL AND array_length(NEW.assigned_to_names, 1) = 0 THEN
        NEW.assigned_to_names := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the consistency trigger
DROP TRIGGER IF EXISTS validate_task_assignment_consistency ON tasks;
CREATE TRIGGER validate_task_assignment_consistency
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_assignment_consistency();