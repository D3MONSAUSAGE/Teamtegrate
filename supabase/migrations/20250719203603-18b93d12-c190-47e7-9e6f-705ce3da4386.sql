-- Add push_token column to users table for mobile notifications
ALTER TABLE public.users ADD COLUMN push_token TEXT;