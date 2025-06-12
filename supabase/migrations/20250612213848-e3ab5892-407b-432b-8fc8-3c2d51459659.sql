
-- Step 1: Query all existing policies on the projects table to see what's actually there
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Also check for any policies that might reference the projects table but are on other tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%projects%' OR with_check LIKE '%projects%')
ORDER BY tablename, policyname;

-- Step 3: Check if there are any functions that might be causing recursion in the policies
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition LIKE '%projects%'
AND routine_name LIKE '%organization%';
