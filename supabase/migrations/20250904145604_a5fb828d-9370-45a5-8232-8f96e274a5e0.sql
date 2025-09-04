-- Safe RLS policy update for meeting security
-- This will safely handle existing policies

-- First, ensure organization_id exists in meeting_participants
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meeting_participants' 
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN organization_id UUID;
    
    -- Update existing records to set organization_id
    UPDATE public.meeting_participants 
    SET organization_id = mr.organization_id
    FROM public.meeting_requests mr
    WHERE meeting_participants.meeting_request_id = mr.id
    AND meeting_participants.organization_id IS NULL;
    
    -- Make it required for new records
    ALTER TABLE public.meeting_participants ALTER COLUMN organization_id SET NOT NULL;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'meeting_participants_organization_id_fkey'
      AND table_name = 'meeting_participants'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.meeting_participants 
      ADD CONSTRAINT meeting_participants_organization_id_fkey 
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
    END IF;
  END IF;
END $$;

-- Safely drop and recreate meeting_requests policies
DO $$
BEGIN
  -- Drop all existing policies on meeting_requests
  DROP POLICY IF EXISTS "Users can view meeting requests in their organization" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Users can create meeting requests" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Users can create meeting requests in their organization" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Users can update their own meeting requests" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Users can delete their own meeting requests" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Organizers can update their meeting requests" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Organizers can delete their meeting requests" ON public.meeting_requests;
  DROP POLICY IF EXISTS "Users can view meetings they're involved in" ON public.meeting_requests;

  -- Create new restrictive policies for meeting_requests
  CREATE POLICY "Users can view meetings they're involved in" 
  ON public.meeting_requests 
  FOR SELECT 
  USING (
    organization_id = get_current_user_organization_id() AND (
      -- User is the organizer
      organizer_id = auth.uid() OR
      -- User is a participant
      id IN (
        SELECT meeting_request_id 
        FROM public.meeting_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

  CREATE POLICY "Users can create meeting requests in their organization" 
  ON public.meeting_requests 
  FOR INSERT 
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND 
    organizer_id = auth.uid()
  );

  CREATE POLICY "Organizers can update their meeting requests" 
  ON public.meeting_requests 
  FOR UPDATE 
  USING (
    organization_id = get_current_user_organization_id() AND 
    organizer_id = auth.uid()
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND 
    organizer_id = auth.uid()
  );

  CREATE POLICY "Organizers can delete their meeting requests" 
  ON public.meeting_requests 
  FOR DELETE 
  USING (
    organization_id = get_current_user_organization_id() AND 
    organizer_id = auth.uid()
  );
END $$;

-- Safely drop and recreate meeting_participants policies
DO $$
BEGIN
  -- Drop all existing policies on meeting_participants
  DROP POLICY IF EXISTS "Users can view meeting participants" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Users can create meeting participants" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Users can update meeting participants" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Users can delete meeting participants" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Users can view participants for meetings they're involved in" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Meeting organizers can add participants" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Users can update their own participation status" ON public.meeting_participants;
  DROP POLICY IF EXISTS "Meeting organizers can remove participants" ON public.meeting_participants;

  CREATE POLICY "Users can view participants for meetings they're involved in" 
  ON public.meeting_participants 
  FOR SELECT 
  USING (
    organization_id = get_current_user_organization_id() AND
    meeting_request_id IN (
      SELECT id FROM public.meeting_requests 
      WHERE organization_id = get_current_user_organization_id() AND (
        organizer_id = auth.uid() OR
        id IN (
          SELECT meeting_request_id 
          FROM public.meeting_participants 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

  CREATE POLICY "Meeting organizers can add participants" 
  ON public.meeting_participants 
  FOR INSERT 
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    meeting_request_id IN (
      SELECT id FROM public.meeting_requests 
      WHERE organizer_id = auth.uid() AND organization_id = get_current_user_organization_id()
    )
  );

  CREATE POLICY "Users can update their own participation status" 
  ON public.meeting_participants 
  FOR UPDATE 
  USING (
    organization_id = get_current_user_organization_id() AND (
      -- User can update their own participation
      user_id = auth.uid() OR
      -- Meeting organizer can update any participant
      meeting_request_id IN (
        SELECT id FROM public.meeting_requests 
        WHERE organizer_id = auth.uid() AND organization_id = get_current_user_organization_id()
      )
    )
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND (
      user_id = auth.uid() OR
      meeting_request_id IN (
        SELECT id FROM public.meeting_requests 
        WHERE organizer_id = auth.uid() AND organization_id = get_current_user_organization_id()
      )
    )
  );

  CREATE POLICY "Meeting organizers can remove participants" 
  ON public.meeting_participants 
  FOR DELETE 
  USING (
    organization_id = get_current_user_organization_id() AND
    meeting_request_id IN (
      SELECT id FROM public.meeting_requests 
      WHERE organizer_id = auth.uid() AND organization_id = get_current_user_organization_id()
    )
  );
END $$;