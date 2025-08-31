-- Create time entry correction requests table
CREATE TABLE public.time_entry_correction_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  manager_id UUID,
  admin_id UUID,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  manager_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'manager_approved', 'approved', 'rejected')),
  employee_reason TEXT NOT NULL,
  manager_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time entry corrections table to store the actual corrections
CREATE TABLE public.time_entry_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  correction_request_id UUID NOT NULL REFERENCES public.time_entry_correction_requests(id) ON DELETE CASCADE,
  time_entry_id UUID NOT NULL,
  original_clock_in TIMESTAMP WITH TIME ZONE,
  original_clock_out TIMESTAMP WITH TIME ZONE,
  original_notes TEXT,
  corrected_clock_in TIMESTAMP WITH TIME ZONE,
  corrected_clock_out TIMESTAMP WITH TIME ZONE,
  corrected_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entry_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entry_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for correction requests
CREATE POLICY "Users can view their own correction requests" 
ON public.time_entry_correction_requests 
FOR SELECT 
USING (organization_id = get_current_user_organization_id() AND employee_id = auth.uid());

CREATE POLICY "Users can create their own correction requests" 
ON public.time_entry_correction_requests 
FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id() AND employee_id = auth.uid());

CREATE POLICY "Managers can view team correction requests" 
ON public.time_entry_correction_requests 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND 
  (
    manager_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
);

CREATE POLICY "Managers can update correction requests" 
ON public.time_entry_correction_requests 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND 
  (
    (manager_id = auth.uid() AND status = 'pending') OR
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
  )
);

-- RLS Policies for corrections
CREATE POLICY "Users can view corrections for their requests" 
ON public.time_entry_corrections 
FOR SELECT 
USING (
  correction_request_id IN (
    SELECT id FROM public.time_entry_correction_requests 
    WHERE organization_id = get_current_user_organization_id() AND 
    (employee_id = auth.uid() OR manager_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
  )
);

CREATE POLICY "Employees can create corrections for their requests" 
ON public.time_entry_corrections 
FOR INSERT 
WITH CHECK (
  correction_request_id IN (
    SELECT id FROM public.time_entry_correction_requests 
    WHERE organization_id = get_current_user_organization_id() AND employee_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_correction_requests_updated_at
BEFORE UPDATE ON public.time_entry_correction_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to notify managers and admins of new requests
CREATE OR REPLACE FUNCTION public.notify_correction_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify manager when request is created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, content, type, organization_id)
    SELECT 
      NEW.manager_id,
      'Time Entry Correction Request',
      'A new time entry correction request needs your review',
      'correction_request',
      NEW.organization_id
    WHERE NEW.manager_id IS NOT NULL;
    
    -- Also notify admins
    INSERT INTO public.notifications (user_id, title, content, type, organization_id)
    SELECT 
      u.id,
      'Time Entry Correction Request',
      'A new time entry correction request has been submitted',
      'correction_request',
      NEW.organization_id
    FROM public.users u
    WHERE u.organization_id = NEW.organization_id 
      AND u.role IN ('admin', 'superadmin');
      
  -- Notify admin when manager approves
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'manager_approved' THEN
    INSERT INTO public.notifications (user_id, title, content, type, organization_id)
    SELECT 
      u.id,
      'Time Entry Correction Approved by Manager',
      'A time entry correction request has been approved by the manager and needs final approval',
      'correction_request',
      NEW.organization_id
    FROM public.users u
    WHERE u.organization_id = NEW.organization_id 
      AND u.role IN ('admin', 'superadmin');
      
  -- Notify employee when request is approved or rejected
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, content, type, organization_id)
    VALUES (
      NEW.employee_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Time Entry Correction Approved'
        ELSE 'Time Entry Correction Rejected'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your time entry correction request has been approved'
        ELSE 'Your time entry correction request has been rejected'
      END,
      'correction_request',
      NEW.organization_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE TRIGGER trigger_notify_correction_request
  AFTER INSERT OR UPDATE ON public.time_entry_correction_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_correction_request();