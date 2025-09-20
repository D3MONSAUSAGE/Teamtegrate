-- Add foreign key constraints to fix the query issues
-- First, let's add the missing foreign keys for request_updates and request_comments

-- Add foreign key from request_updates to users table
ALTER TABLE public.request_updates 
ADD CONSTRAINT fk_request_updates_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add foreign key from request_updates to requests table  
ALTER TABLE public.request_updates 
ADD CONSTRAINT fk_request_updates_request_id 
FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;

-- Add foreign key from request_comments to users table
ALTER TABLE public.request_comments 
ADD CONSTRAINT fk_request_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add foreign key from request_comments to requests table
ALTER TABLE public.request_comments 
ADD CONSTRAINT fk_request_comments_request_id 
FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;