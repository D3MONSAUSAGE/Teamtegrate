-- Create trigger function to notify admins of new bug reports
CREATE OR REPLACE FUNCTION public.notify_admins_of_bug_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert notifications for all admins in the organization
  INSERT INTO public.notifications (
    user_id,
    organization_id,
    title,
    content,
    type,
    created_at
  )
  SELECT 
    u.id,
    NEW.organization_id,
    'New Bug Report',
    'Bug report "' || NEW.title || '" has been submitted and needs review',
    'bug_report',
    now()
  FROM public.users u
  WHERE u.organization_id = NEW.organization_id
    AND u.role IN ('admin', 'superadmin', 'manager');
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically notify admins when bug reports are inserted
CREATE TRIGGER notify_admins_on_bug_report
  AFTER INSERT ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_of_bug_report();