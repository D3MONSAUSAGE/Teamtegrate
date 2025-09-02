-- Update RLS policies for team-based document access
DROP POLICY IF EXISTS "Users can view documents from their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents in their organization" ON public.documents;

-- Team-aware document policies
CREATE POLICY "Users can view documents from their teams" ON public.documents
FOR SELECT USING (
  organization_id = get_current_user_organization_id() AND (
    -- Admins and superadmins can see all documents in their org
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Team members can see documents from their teams
    team_id IN (
      SELECT tm.team_id FROM public.team_memberships tm
      WHERE tm.user_id = auth.uid()
    ) OR
    -- Documents without team_id can be seen by all (legacy documents)
    team_id IS NULL
  )
);

CREATE POLICY "Users can create documents for their teams" ON public.documents
FOR INSERT WITH CHECK (
  organization_id = get_current_user_organization_id() AND (
    -- Admins can create documents for any team
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Team members can create documents for teams they belong to
    team_id IN (
      SELECT tm.team_id FROM public.team_memberships tm
      WHERE tm.user_id = auth.uid()
    ) OR
    -- Allow creating documents without team (for migration compatibility)
    team_id IS NULL
  )
);

CREATE POLICY "Users can update documents from their teams" ON public.documents
FOR UPDATE USING (
  organization_id = get_current_user_organization_id() AND (
    -- Admins can update any document
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Team members can update documents from their teams
    team_id IN (
      SELECT tm.team_id FROM public.team_memberships tm
      WHERE tm.user_id = auth.uid()
    ) OR
    -- Original uploader can always update their documents
    user_id = auth.uid() OR
    -- Documents without team_id can be updated by all (legacy)
    team_id IS NULL
  )
);

CREATE POLICY "Users can delete documents from their teams" ON public.documents
FOR DELETE USING (
  organization_id = get_current_user_organization_id() AND (
    -- Admins can delete any document
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Team members can delete documents from their teams
    team_id IN (
      SELECT tm.team_id FROM public.team_memberships tm
      WHERE tm.user_id = auth.uid()
    ) OR
    -- Original uploader can always delete their documents
    user_id = auth.uid() OR
    -- Documents without team_id can be deleted by all (legacy)
    team_id IS NULL
  )
);