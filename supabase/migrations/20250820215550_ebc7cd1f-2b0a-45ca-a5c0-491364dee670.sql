-- Fix search path for the new archive function
CREATE OR REPLACE FUNCTION get_archive_threshold_days(user_id_param uuid)
RETURNS integer AS $$
DECLARE
  threshold_days integer;
  user_org_id uuid;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id 
  FROM users WHERE id = user_id_param;
  
  -- First try user-specific setting
  SELECT archive_settings.threshold_days INTO threshold_days
  FROM archive_settings
  WHERE user_id = user_id_param;
  
  -- If no user setting, try organization setting
  IF threshold_days IS NULL THEN
    SELECT archive_settings.threshold_days INTO threshold_days
    FROM archive_settings
    WHERE organization_id = user_org_id AND user_id IS NULL;
  END IF;
  
  -- Default to 90 days if no setting found
  RETURN COALESCE(threshold_days, 90);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;