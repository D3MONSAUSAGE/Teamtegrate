
-- Phase 4: Complete Table Coverage - RLS Policies for Remaining Tables

-- 1. Comments Table RLS Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view comments in their organization" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments in their organization" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON public.comments;

-- Comments policies
CREATE POLICY "comments_select_organization" 
ON public.comments 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "comments_insert_organization" 
ON public.comments 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "comments_update_own_or_admin" 
ON public.comments 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

CREATE POLICY "comments_delete_own_or_admin" 
ON public.comments 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- 2. Chat Rooms Table RLS Policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view chat rooms in their organization" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms in their organization" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can delete rooms" ON public.chat_rooms;

-- Chat rooms policies
CREATE POLICY "chat_rooms_select_organization" 
ON public.chat_rooms 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "chat_rooms_insert_organization" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "chat_rooms_update_creator_or_admin" 
ON public.chat_rooms 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    created_by = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

CREATE POLICY "chat_rooms_delete_creator_or_admin" 
ON public.chat_rooms 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    created_by = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- 3. Chat Messages Table RLS Policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view messages in their organization" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their organization" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any" ON public.chat_messages;

-- Chat messages policies
CREATE POLICY "chat_messages_select_organization" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "chat_messages_insert_organization" 
ON public.chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "chat_messages_update_own_or_admin" 
ON public.chat_messages 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

CREATE POLICY "chat_messages_delete_own_or_admin" 
ON public.chat_messages 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- 4. Notifications Table RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Notifications policies
CREATE POLICY "notifications_select_own_in_organization" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND user_id = auth.uid()
);

CREATE POLICY "notifications_insert_organization" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "notifications_update_own_in_organization" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND user_id = auth.uid()
);

CREATE POLICY "notifications_delete_own_in_organization" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND user_id = auth.uid()
);

-- 5. Documents Table RLS Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents or admins can delete any" ON public.documents;

-- Documents policies
CREATE POLICY "documents_select_organization" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "documents_insert_organization" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "documents_update_own_or_admin" 
ON public.documents 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

CREATE POLICY "documents_delete_own_or_admin" 
ON public.documents 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- 6. Events Table RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view events in their organization" ON public.events;
DROP POLICY IF EXISTS "Users can create events in their organization" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events or admins can delete any" ON public.events;

-- Events policies
CREATE POLICY "events_select_organization" 
ON public.events 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "events_insert_organization" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "events_update_own_or_admin" 
ON public.events 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

CREATE POLICY "events_delete_own_or_admin" 
ON public.events 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- 7. Time Entries Table RLS Policies
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view time entries in their organization" ON public.time_entries;
DROP POLICY IF EXISTS "Users can create time entries in their organization" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete their own time entries or admins can delete any" ON public.time_entries;

-- Time entries policies
CREATE POLICY "time_entries_select_organization" 
ON public.time_entries 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "time_entries_insert_organization" 
ON public.time_entries 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "time_entries_update_own_or_admin" 
ON public.time_entries 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

CREATE POLICY "time_entries_delete_own_or_admin" 
ON public.time_entries 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);
