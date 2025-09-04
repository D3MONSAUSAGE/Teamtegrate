-- Create trigger on training_assignments table for certificate status changes
CREATE OR REPLACE TRIGGER certificate_status_change_trigger
  AFTER UPDATE ON public.training_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_certificate_status_change();