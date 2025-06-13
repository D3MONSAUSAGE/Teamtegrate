
-- Clean up tasks with assigned_to_id but missing assigned_to_names
UPDATE tasks 
SET assigned_to_names = ARRAY[u.name]
FROM users u 
WHERE tasks.assigned_to_id = u.id::text 
  AND tasks.assigned_to_id IS NOT NULL 
  AND tasks.assigned_to_id != ''
  AND (tasks.assigned_to_names IS NULL OR array_length(tasks.assigned_to_names, 1) IS NULL OR tasks.assigned_to_names = '{}');

-- Clean up tasks with invalid assigned_to_id (not matching any user)
UPDATE tasks 
SET assigned_to_id = NULL, 
    assigned_to_names = NULL
WHERE assigned_to_id IS NOT NULL 
  AND assigned_to_id != ''
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE id::text = tasks.assigned_to_id
  );

-- Clean up tasks with assigned_to_ids but missing corresponding assigned_to_names
UPDATE tasks 
SET assigned_to_names = (
    SELECT array_agg(u.name ORDER BY array_position(tasks.assigned_to_ids, u.id::text))
    FROM users u 
    WHERE u.id::text = ANY(tasks.assigned_to_ids)
)
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) > 0
  AND (assigned_to_names IS NULL OR array_length(assigned_to_names, 1) != array_length(assigned_to_ids, 1));

-- Remove invalid user IDs from assigned_to_ids arrays
UPDATE tasks 
SET assigned_to_ids = (
    SELECT array_agg(user_id ORDER BY array_position(tasks.assigned_to_ids, user_id))
    FROM unnest(tasks.assigned_to_ids) AS user_id
    WHERE EXISTS (SELECT 1 FROM users WHERE id::text = user_id)
),
assigned_to_names = (
    SELECT array_agg(u.name ORDER BY array_position(tasks.assigned_to_ids, u.id::text))
    FROM users u 
    WHERE u.id::text = ANY(tasks.assigned_to_ids)
)
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(assigned_to_ids) AS user_id
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE id::text = user_id)
  );
