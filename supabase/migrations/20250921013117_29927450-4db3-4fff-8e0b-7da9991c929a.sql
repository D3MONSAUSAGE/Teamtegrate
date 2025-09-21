-- Add team support to existing inventory tables
ALTER TABLE public.inventory_items 
ADD COLUMN team_id uuid REFERENCES public.teams(id),
ADD COLUMN is_template boolean NOT NULL DEFAULT false,
ADD COLUMN template_name text,
ADD COLUMN expected_cost numeric(10,2),
ADD COLUMN sort_order integer DEFAULT 0;

-- Create inventory templates table
CREATE TABLE public.inventory_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create template items junction table
CREATE TABLE public.inventory_template_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.inventory_templates(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  expected_quantity numeric(10,2) DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(template_id, item_id)
);

-- Create team inventory assignments table
CREATE TABLE public.team_inventory_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.inventory_templates(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  schedule_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  due_time time DEFAULT '23:59:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, template_id)
);

-- Add team reference to inventory counts
ALTER TABLE public.inventory_counts 
ADD COLUMN team_id uuid REFERENCES public.teams(id),
ADD COLUMN template_id uuid REFERENCES public.inventory_templates(id),
ADD COLUMN assigned_to uuid,
ADD COLUMN completion_percentage numeric(5,2) DEFAULT 0,
ADD COLUMN variance_count integer DEFAULT 0,
ADD COLUMN total_items_count integer DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.inventory_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_inventory_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_templates
CREATE POLICY "Users can view templates in their organization" 
ON public.inventory_templates 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create templates" 
ON public.inventory_templates 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

CREATE POLICY "Managers can update their templates" 
ON public.inventory_templates 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
);

-- RLS Policies for inventory_template_items
CREATE POLICY "Users can view template items in their organization" 
ON public.inventory_template_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_templates 
    WHERE id = template_id 
    AND organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Managers can manage template items" 
ON public.inventory_template_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory_templates 
    WHERE id = template_id 
    AND organization_id = get_current_user_organization_id()
    AND (
      created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_templates 
    WHERE id = template_id 
    AND organization_id = get_current_user_organization_id()
    AND (
      created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
      )
    )
  )
);

-- RLS Policies for team_inventory_assignments
CREATE POLICY "Users can view assignments in their organization" 
ON public.team_inventory_assignments 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create assignments" 
ON public.team_inventory_assignments 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND assigned_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

CREATE POLICY "Managers can update assignments" 
ON public.team_inventory_assignments 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    assigned_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
);

-- Update existing RLS policies for inventory_items to include team access
DROP POLICY IF EXISTS "Users can view items in their organization" ON public.inventory_items;
CREATE POLICY "Users can view items in their organization" 
ON public.inventory_items 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND (
    team_id IS NULL 
    OR team_id IN (
      SELECT team_id FROM public.team_memberships 
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
);

-- Update inventory_counts RLS to include team access
DROP POLICY IF EXISTS "Users can view counts in their organization" ON public.inventory_counts;
CREATE POLICY "Users can view counts in their organization" 
ON public.inventory_counts 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND (
    team_id IS NULL 
    OR team_id IN (
      SELECT team_id FROM public.team_memberships 
      WHERE user_id = auth.uid()
    )
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_inventory_templates_updated_at
BEFORE UPDATE ON public.inventory_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_inventory_assignments_updated_at
BEFORE UPDATE ON public.team_inventory_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_inventory_items_team_id ON public.inventory_items(team_id);
CREATE INDEX idx_inventory_templates_team_id ON public.inventory_templates(team_id);
CREATE INDEX idx_inventory_templates_organization_id ON public.inventory_templates(organization_id);
CREATE INDEX idx_team_inventory_assignments_team_id ON public.team_inventory_assignments(team_id);
CREATE INDEX idx_team_inventory_assignments_template_id ON public.team_inventory_assignments(template_id);
CREATE INDEX idx_inventory_counts_team_id ON public.inventory_counts(team_id);
CREATE INDEX idx_inventory_counts_template_id ON public.inventory_counts(template_id);