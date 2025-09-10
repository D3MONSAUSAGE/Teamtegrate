-- Remove the unsafe RPC function that causes app freezing
DROP FUNCTION IF EXISTS public.delete_training_assignment_safe(uuid);