-- Add approval_status enum for time entries
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval columns to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN approval_notes TEXT,
ADD COLUMN approval_rejected_reason TEXT;

-- Update existing time_entries to have pending status by default
-- (This is safe since we just added the column with default value)

-- Add index for efficient querying of pending approvals
CREATE INDEX idx_time_entries_approval_status ON public.time_entries(approval_status);
CREATE INDEX idx_time_entries_approved_by ON public.time_entries(approved_by) WHERE approved_by IS NOT NULL;

-- Add function to get pending time entries for managers
CREATE OR REPLACE FUNCTION public.get_pending_time_approvals(manager_user_id uuid, team_filter_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  duration_minutes integer,
  notes text,
  team_id uuid,
  team_name text,
  created_at timestamp with time zone,
  work_date date
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  manager_role text;
  manager_org_id uuid;
BEGIN
  -- Get manager's role and organization
  SELECT role, organization_id INTO manager_role, manager_org_id
  FROM public.users 
  WHERE id = manager_user_id;
  
  -- Verify manager has appropriate role
  IF manager_role NOT IN ('manager', 'admin', 'superadmin') THEN
    RETURN;
  END IF;
  
  -- Return pending time entries for manager's organization
  -- If team_filter_id is provided, filter by team
  RETURN QUERY
  SELECT 
    te.id,
    te.user_id,
    u.name as user_name,
    u.email as user_email,
    te.clock_in,
    te.clock_out,
    te.duration_minutes,
    te.notes,
    te.team_id,
    t.name as team_name,
    te.created_at,
    DATE(te.clock_in AT TIME ZONE 'UTC') as work_date
  FROM public.time_entries te
  JOIN public.users u ON te.user_id = u.id
  LEFT JOIN public.teams t ON te.team_id = t.id
  WHERE te.organization_id = manager_org_id
    AND te.approval_status = 'pending'
    AND te.clock_out IS NOT NULL  -- Only completed entries need approval
    AND (team_filter_id IS NULL OR te.team_id = team_filter_id)
  ORDER BY te.clock_in DESC;
END;
$$;

-- Add function to approve/reject time entries
CREATE OR REPLACE FUNCTION public.manage_time_entry_approval(
  entry_id uuid,
  manager_id uuid,
  new_status approval_status,
  approval_notes_text text DEFAULT NULL,
  rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  manager_role text;
  manager_org_id uuid;
  entry_org_id uuid;
  entry_user_id uuid;
  result jsonb;
BEGIN
  -- Get manager's role and organization
  SELECT role, organization_id INTO manager_role, manager_org_id
  FROM public.users 
  WHERE id = manager_id;
  
  -- Verify manager has appropriate role
  IF manager_role NOT IN ('manager', 'admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get time entry details
  SELECT organization_id, user_id INTO entry_org_id, entry_user_id
  FROM public.time_entries
  WHERE id = entry_id;
  
  -- Verify entry exists and is in same organization
  IF entry_org_id IS NULL OR entry_org_id != manager_org_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Time entry not found or access denied');
  END IF;
  
  -- Update the time entry
  UPDATE public.time_entries
  SET 
    approval_status = new_status,
    approved_by = CASE WHEN new_status = 'approved' THEN manager_id ELSE approved_by END,
    approved_at = CASE WHEN new_status = 'approved' THEN now() ELSE approved_at END,
    approval_notes = approval_notes_text,
    approval_rejected_reason = CASE WHEN new_status = 'rejected' THEN rejection_reason ELSE NULL END
  WHERE id = entry_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Time entry ' || new_status::text || ' successfully',
    'entry_id', entry_id,
    'status', new_status
  );
END;
$$;

-- Add function for bulk approval
CREATE OR REPLACE FUNCTION public.bulk_approve_time_entries(
  entry_ids uuid[],
  manager_id uuid,
  approval_notes_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  manager_role text;
  manager_org_id uuid;
  processed_count integer := 0;
  entry_id uuid;
BEGIN
  -- Get manager's role and organization
  SELECT role, organization_id INTO manager_role, manager_org_id
  FROM public.users 
  WHERE id = manager_id;
  
  -- Verify manager has appropriate role
  IF manager_role NOT IN ('manager', 'admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Process each entry
  FOREACH entry_id IN ARRAY entry_ids
  LOOP
    UPDATE public.time_entries
    SET 
      approval_status = 'approved',
      approved_by = manager_id,
      approved_at = now(),
      approval_notes = approval_notes_text
    WHERE id = entry_id
      AND organization_id = manager_org_id
      AND approval_status = 'pending';
    
    IF FOUND THEN
      processed_count := processed_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bulk approval completed',
    'processed_count', processed_count,
    'total_requested', array_length(entry_ids, 1)
  );
END;
$$;