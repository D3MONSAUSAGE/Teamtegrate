-- Prevent duplicate active training assignments per user/content/type
-- Creates a partial unique index allowing multiple records only when previous is completed
CREATE UNIQUE INDEX IF NOT EXISTS uq_training_active_assignment
ON public.training_assignments (assigned_to, content_id, assignment_type)
WHERE status <> 'completed';