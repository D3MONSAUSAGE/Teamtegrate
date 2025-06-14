
-- Normalize existing task assignment data
-- Step 1: For tasks with assigned_to_id but empty assigned_to_ids, populate assigned_to_ids
UPDATE tasks 
SET assigned_to_ids = ARRAY[assigned_to_id]
WHERE assigned_to_id IS NOT NULL 
  AND assigned_to_id != ''
  AND (assigned_to_ids IS NULL OR array_length(assigned_to_ids, 1) IS NULL OR assigned_to_ids = '{}');

-- Step 2: Ensure assigned_to_names is populated for tasks with assigned_to_id but missing names
UPDATE tasks 
SET assigned_to_names = ARRAY[u.name]
FROM users u 
WHERE tasks.assigned_to_id = u.id::text 
  AND tasks.assigned_to_id IS NOT NULL 
  AND tasks.assigned_to_id != ''
  AND (tasks.assigned_to_names IS NULL OR array_length(tasks.assigned_to_names, 1) IS NULL OR tasks.assigned_to_names = '{}');

-- Step 3: Clean up any inconsistent data where assigned_to_ids exists but assigned_to_id doesn't match
UPDATE tasks 
SET assigned_to_id = assigned_to_ids[1]
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) = 1
  AND (assigned_to_id IS NULL OR assigned_to_id != assigned_to_ids[1]);

-- Step 4: For multi-assignments (more than 1 user), clear the single assignment field
UPDATE tasks 
SET assigned_to_id = NULL
WHERE assigned_to_ids IS NOT NULL 
  AND array_length(assigned_to_ids, 1) > 1
  AND assigned_to_id IS NOT NULL;
