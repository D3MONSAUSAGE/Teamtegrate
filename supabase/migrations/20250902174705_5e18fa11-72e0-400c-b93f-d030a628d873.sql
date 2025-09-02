-- Create folders table for proper folder management
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  team_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, team_id, name)
);

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view folders in their organization" 
ON public.folders 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create folders in their organization" 
ON public.folders 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update folders they created" 
ON public.folders 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
)
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can delete folders they created" 
ON public.folders 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
);

-- Managers can manage all folders in their teams
CREATE POLICY "Managers can manage team folders" 
ON public.folders 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    team_id IN (
      SELECT t.id FROM teams t 
      WHERE t.manager_id = auth.uid() 
      AND t.organization_id = get_current_user_organization_id()
    )
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'superadmin')
    )
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id()
);

-- Add updated_at trigger
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update documents table to use folder_id instead of folder string
ALTER TABLE public.documents ADD COLUMN folder_id UUID REFERENCES public.folders(id);
CREATE INDEX idx_documents_folder_id ON public.documents(folder_id);