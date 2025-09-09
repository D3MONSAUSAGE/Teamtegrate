-- Add permission-related fields to request_types table
ALTER TABLE public.request_types 
ADD COLUMN IF NOT EXISTS required_permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS creator_role_restrictions TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS viewer_role_restrictions TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS permission_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for better performance on permission queries
CREATE INDEX IF NOT EXISTS idx_request_types_permissions ON public.request_types USING GIN (required_permissions);

-- Update existing request types with default permission settings based on category
UPDATE public.request_types 
SET 
  required_permissions = 
    CASE 
      WHEN category = 'it_access' THEN '[{"module_id": "requests", "action_id": "create"}]'::jsonb
      WHEN category = 'hr_admin' THEN '[{"module_id": "requests", "action_id": "create"}]'::jsonb
      WHEN category = 'financial' THEN '[{"module_id": "requests", "action_id": "create"}]'::jsonb
      WHEN category = 'training' THEN '[{"module_id": "requests", "action_id": "create"}]'::jsonb
      ELSE '[{"module_id": "requests", "action_id": "create"}]'::jsonb
    END,
  creator_role_restrictions = 
    CASE 
      WHEN category = 'financial' THEN ARRAY['manager', 'admin', 'superadmin']
      WHEN category = 'hr_admin' THEN ARRAY['team_leader', 'manager', 'admin', 'superadmin']  
      ELSE NULL
    END,
  viewer_role_restrictions = 
    CASE 
      WHEN category = 'financial' THEN ARRAY['manager', 'admin', 'superadmin']
      ELSE NULL
    END
WHERE required_permissions IS NULL OR required_permissions = '[]'::jsonb;