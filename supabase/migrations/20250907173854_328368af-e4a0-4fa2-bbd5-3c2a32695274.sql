-- Clean up existing duplicate active assignments, keeping the most recent per user/content/type
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY assigned_to, content_id, assignment_type 
           ORDER BY COALESCE(updated_at, assigned_at, created_at) DESC, id DESC
         ) AS rn
  FROM public.training_assignments
  WHERE status <> 'completed'
)
DELETE FROM public.training_assignments ta
USING duplicates d
WHERE ta.id = d.id
AND d.rn > 1;

-- Prevent future duplicate active assignments per user/content/type
CREATE UNIQUE INDEX IF NOT EXISTS uq_training_active_assignment
ON public.training_assignments (assigned_to, content_id, assignment_type)
WHERE status <> 'completed';