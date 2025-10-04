-- QR Attendance System Tables

-- QR Attendance tokens (time-limited, one-time use)
CREATE TABLE public.qr_attendance_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  token_type text NOT NULL CHECK (token_type IN ('clock_in', 'clock_out')),
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  used_at_location text,
  created_at timestamptz DEFAULT now()
);

-- QR Scanner stations (wall-mounted tablets)
CREATE TABLE public.qr_scanner_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  station_name text NOT NULL,
  location text NOT NULL,
  ip_address text,
  is_active boolean DEFAULT true,
  last_scan_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendance scan logs
CREATE TABLE public.attendance_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_id uuid REFERENCES public.qr_attendance_tokens(id) ON DELETE SET NULL,
  station_id uuid REFERENCES public.qr_scanner_stations(id) ON DELETE SET NULL,
  scan_type text NOT NULL CHECK (scan_type IN ('clock_in', 'clock_out')),
  scan_status text NOT NULL CHECK (scan_status IN ('success', 'expired', 'already_used', 'invalid', 'schedule_mismatch', 'error')),
  error_message text,
  scanned_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_qr_tokens_user ON public.qr_attendance_tokens(user_id);
CREATE INDEX idx_qr_tokens_expires ON public.qr_attendance_tokens(expires_at);
CREATE INDEX idx_qr_tokens_token ON public.qr_attendance_tokens(token) WHERE NOT is_used;
CREATE INDEX idx_scan_logs_user ON public.attendance_scan_logs(user_id);
CREATE INDEX idx_scan_logs_station ON public.attendance_scan_logs(station_id);
CREATE INDEX idx_scan_logs_scanned_at ON public.attendance_scan_logs(scanned_at DESC);

-- Enable RLS
ALTER TABLE public.qr_attendance_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scanner_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_scan_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_attendance_tokens
CREATE POLICY "Users can generate their own QR tokens"
  ON public.qr_attendance_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id AND organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can view their own active tokens"
  ON public.qr_attendance_tokens FOR SELECT
  USING (auth.uid() = user_id AND organization_id = public.get_current_user_organization_id());

CREATE POLICY "System can update used tokens"
  ON public.qr_attendance_tokens FOR UPDATE
  USING (organization_id = public.get_current_user_organization_id());

-- RLS Policies for qr_scanner_stations
CREATE POLICY "Admins can manage scanner stations"
  ON public.qr_scanner_stations FOR ALL
  USING (
    organization_id = public.get_current_user_organization_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
    )
  );

CREATE POLICY "Anyone in org can view scanner stations"
  ON public.qr_scanner_stations FOR SELECT
  USING (organization_id = public.get_current_user_organization_id());

-- RLS Policies for attendance_scan_logs
CREATE POLICY "Users can view their own scan logs"
  ON public.attendance_scan_logs FOR SELECT
  USING (
    auth.uid() = user_id 
    AND organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY "Managers can view all scan logs in org"
  ON public.attendance_scan_logs FOR SELECT
  USING (
    organization_id = public.get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
    )
  );

CREATE POLICY "System can insert scan logs"
  ON public.attendance_scan_logs FOR INSERT
  WITH CHECK (organization_id = public.get_current_user_organization_id());

-- Trigger to update scanner station last_scan_at
CREATE OR REPLACE FUNCTION public.update_scanner_last_scan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scan_status = 'success' THEN
    UPDATE public.qr_scanner_stations
    SET last_scan_at = NEW.scanned_at
    WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_scanner_last_scan_trigger
  AFTER INSERT ON public.attendance_scan_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scanner_last_scan();

-- Auto-cleanup expired tokens (run daily)
CREATE OR REPLACE FUNCTION public.cleanup_expired_qr_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.qr_attendance_tokens
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;