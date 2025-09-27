-- Create trigger to auto-populate organization_id and created_by for nutritional info
CREATE OR REPLACE FUNCTION public.set_nutritional_info_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from current user's organization if not provided
  IF NEW.organization_id IS NULL OR NEW.organization_id = '' THEN
    NEW.organization_id := public.get_current_user_organization_id();
  END IF;
  
  -- Set created_by from current user if not provided
  IF NEW.created_by IS NULL OR NEW.created_by = '' THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_nutritional_info_organization ON public.inventory_nutritional_info;
CREATE TRIGGER trigger_set_nutritional_info_organization
  BEFORE INSERT OR UPDATE ON public.inventory_nutritional_info
  FOR EACH ROW EXECUTE FUNCTION public.set_nutritional_info_organization();