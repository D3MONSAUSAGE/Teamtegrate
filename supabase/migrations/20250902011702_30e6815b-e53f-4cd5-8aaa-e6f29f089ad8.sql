-- Harden function search_path per linter recommendation
CREATE OR REPLACE FUNCTION public.update_permission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;