-- Create attendance settings table
CREATE TABLE IF NOT EXISTS public.organization_attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Schedule validation settings
  require_schedule_for_clock_in BOOLEAN DEFAULT false,
  allow_early_clock_in_minutes INTEGER DEFAULT 15,
  allow_late_clock_in_minutes INTEGER DEFAULT 15,
  
  -- QR code settings
  qr_expiration_seconds INTEGER DEFAULT 45,
  allow_manager_assisted BOOLEAN DEFAULT true,
  
  -- Future expansion
  require_geofencing BOOLEAN DEFAULT false,
  require_photo_capture BOOLEAN DEFAULT false,
  max_daily_clock_ins INTEGER DEFAULT 10,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_attendance_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their org attendance settings
CREATE POLICY "Users can view their org attendance settings"
  ON public.organization_attendance_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Only admins can insert/update/delete attendance settings
CREATE POLICY "Admins can manage attendance settings"
  ON public.organization_attendance_settings FOR ALL
  USING (
    organization_id IN (
      SELECT u.organization_id 
      FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_attendance_settings_updated_at
  BEFORE UPDATE ON public.organization_attendance_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();