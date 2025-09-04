-- Create trigger function for certificate status change notifications
CREATE OR REPLACE FUNCTION public.log_certificate_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when certificate status actually changes
  IF TG_OP = 'UPDATE' AND OLD.certificate_status IS DISTINCT FROM NEW.certificate_status THEN
    -- Insert notification for status change
    INSERT INTO public.notifications (
      user_id, 
      organization_id,
      title, 
      content, 
      type,
      metadata
    )
    SELECT 
      NEW.assigned_to,
      NEW.organization_id,
      'Certificate Status Update',
      'Your certificate for "' || NEW.content_title || '" has been ' || 
      CASE 
        WHEN NEW.certificate_status = 'verified' THEN 'approved'
        WHEN NEW.certificate_status = 'rejected' THEN 'rejected'
        ELSE NEW.certificate_status
      END,
      'certificate_status',
      jsonb_build_object(
        'assignment_id', NEW.id,
        'course_title', NEW.content_title,
        'old_status', OLD.certificate_status,
        'new_status', NEW.certificate_status,
        'verification_notes', NEW.verification_notes
      )
    WHERE NEW.assigned_to IS NOT NULL;

    -- Also notify admins/managers when certificate is uploaded
    IF NEW.certificate_status = 'uploaded' THEN
      INSERT INTO public.notifications (
        user_id,
        organization_id,
        title,
        content,
        type,
        metadata
      )
      SELECT 
        u.id,
        NEW.organization_id,
        'New Certificate Uploaded',
        (SELECT name FROM public.users WHERE id = NEW.assigned_to) || ' uploaded a certificate for "' || NEW.content_title || '"',
        'certificate_upload',
        jsonb_build_object(
          'assignment_id', NEW.id,
          'course_title', NEW.content_title,
          'uploaded_by', NEW.assigned_to,
          'uploaded_at', NEW.certificate_uploaded_at
        )
      FROM public.users u
      WHERE u.organization_id = NEW.organization_id 
        AND u.role IN ('admin', 'superadmin', 'manager');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;