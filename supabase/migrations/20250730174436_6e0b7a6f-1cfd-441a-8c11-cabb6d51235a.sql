-- Reassociate orphaned tasks to "ITEM 7" project
UPDATE public.tasks 
SET project_id = '43866de0-abe0-48eb-8b63-88824b47759d'
WHERE id IN (
  '171c5cef-72dd-4b15-a0a0-12c119eae6bf',  -- "Dulce will send item 7 to shelton today"
  '17b22c0e-0fb3-4226-8c44-b964aa8f43da',  -- "item 7 x 3" 
  'd679b4da-11aa-450d-ac2d-62fcbdd525a8'   -- "complete full inventory for item 7"
);

-- Verify the tasks are now properly linked
SELECT 
  t.id,
  t.title,
  t.project_id,
  p.title as project_title
FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
WHERE t.id IN (
  '171c5cef-72dd-4b15-a0a0-12c119eae6bf',
  '17b22c0e-0fb3-4226-8c44-b964aa8f43da', 
  'd679b4da-11aa-450d-ac2d-62fcbdd525a8'
);

-- Check the updated tasks_count for ITEM 7 project
SELECT 
  id,
  title,
  tasks_count,
  (SELECT COUNT(*) FROM public.tasks WHERE project_id = '43866de0-abe0-48eb-8b63-88824b47759d') as actual_task_count
FROM public.projects 
WHERE id = '43866de0-abe0-48eb-8b63-88824b47759d';