-- Create video library categories table
CREATE TABLE public.video_library_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video library items table
CREATE TABLE public.video_library_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  category_id UUID REFERENCES public.video_library_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video library permissions table
CREATE TABLE public.video_library_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.video_library_items(id) ON DELETE CASCADE,
  user_id UUID,
  team_id UUID,
  permission_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'manage'
  granted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure either user_id or team_id is set, not both
  CONSTRAINT check_user_or_team CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR 
    (user_id IS NULL AND team_id IS NOT NULL)
  )
);

-- Enable RLS on all tables
ALTER TABLE public.video_library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_library_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_library_categories
CREATE POLICY "Users can view categories in their organization" 
ON public.video_library_categories 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage categories" 
ON public.video_library_categories 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  created_by = auth.uid()
);

-- RLS Policies for video_library_items  
CREATE POLICY "Users can view videos they have access to" 
ON public.video_library_items 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND 
  (
    -- Admins can see all videos
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    ) OR
    -- Users can see videos they have permission for
    EXISTS (
      SELECT 1 FROM video_library_permissions vlp
      WHERE vlp.video_id = video_library_items.id AND (
        vlp.user_id = auth.uid() OR
        vlp.team_id IN (
          SELECT tm.team_id FROM team_memberships tm 
          WHERE tm.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Managers can manage videos" 
ON public.video_library_items 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  created_by = auth.uid()
);

-- RLS Policies for video_library_permissions
CREATE POLICY "Users can view permissions in their organization" 
ON public.video_library_permissions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage permissions" 
ON public.video_library_permissions 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin')
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  granted_by = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX idx_video_library_items_organization ON video_library_items(organization_id);
CREATE INDEX idx_video_library_items_category ON video_library_items(category_id);
CREATE INDEX idx_video_library_permissions_video ON video_library_permissions(video_id);
CREATE INDEX idx_video_library_permissions_user ON video_library_permissions(user_id);
CREATE INDEX idx_video_library_permissions_team ON video_library_permissions(team_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_video_library_categories_updated_at
  BEFORE UPDATE ON public.video_library_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_library_items_updated_at
  BEFORE UPDATE ON public.video_library_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();