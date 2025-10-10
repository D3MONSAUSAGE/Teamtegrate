-- Create employee_records table for HR document management
CREATE TABLE IF NOT EXISTS public.employee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  uploader_id UUID NOT NULL,
  uploader_name TEXT NOT NULL,
  
  -- Document metadata
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'id', 'tax_form', 'certification', 'performance_review', 'other')),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  
  -- Additional fields
  document_date DATE,
  expiry_date DATE,
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_employee_records_org ON public.employee_records(organization_id);
CREATE INDEX idx_employee_records_employee ON public.employee_records(employee_id);
CREATE INDEX idx_employee_records_type ON public.employee_records(document_type);
CREATE INDEX idx_employee_records_expiry ON public.employee_records(expiry_date) WHERE expiry_date IS NOT NULL;

-- Enable RLS
ALTER TABLE public.employee_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- HR/Admins/Managers can see all records in their organization
CREATE POLICY "Managers can view all employee records"
  ON public.employee_records
  FOR SELECT
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- Employees can only see their own records
CREATE POLICY "Employees can view their own records"
  ON public.employee_records
  FOR SELECT
  USING (
    organization_id = get_current_user_organization_id() AND
    employee_id = auth.uid()
  );

-- HR/Admins/Managers can upload records
CREATE POLICY "Managers can upload employee records"
  ON public.employee_records
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    uploader_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- HR/Admins/Managers can update records
CREATE POLICY "Managers can update employee records"
  ON public.employee_records
  FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- HR/Admins/Managers can delete records
CREATE POLICY "Managers can delete employee records"
  ON public.employee_records
  FOR DELETE
  USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- Create storage bucket for employee records if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-records', 'employee-records', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee records bucket
CREATE POLICY "Managers can upload employee records to storage"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'employee-records' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can view all employee records in storage"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'employee-records' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Employees can view their own records in storage"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'employee-records' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Managers can delete employee records from storage"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'employee-records' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_employee_records_updated_at
  BEFORE UPDATE ON public.employee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();