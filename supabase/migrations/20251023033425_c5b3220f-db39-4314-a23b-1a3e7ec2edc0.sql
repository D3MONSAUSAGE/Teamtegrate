-- Drop the invalid self-referencing foreign key constraint on users.id
-- This constraint prevents new users from being created because it requires
-- the new UUID to already exist in the table (chicken-and-egg problem)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;