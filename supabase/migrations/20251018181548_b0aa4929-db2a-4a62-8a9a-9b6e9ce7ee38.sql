-- Add requirement_id and tracking columns to employee_records
ALTER TABLE employee_records 
ADD COLUMN IF NOT EXISTS requirement_id UUID REFERENCES template_document_requirements(id),
ADD COLUMN IF NOT EXISTS renewal_reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_reminder_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employee_records_employee_requirement 
  ON employee_records(employee_id, requirement_id);

-- Create the compliance tracking view with correct column names
CREATE OR REPLACE VIEW document_compliance_tracking AS
SELECT 
  u.id as employee_id,
  u.name as employee_name,
  u.role as employee_role,
  u.organization_id,
  edt.id as template_id,
  edt.name as template_name,
  tdr.id as requirement_id,
  tdr.document_name,
  tdr.document_type,
  tdr.is_required,
  tdr.requires_expiry,
  tdr.default_validity_days,
  er.id as record_id,
  er.file_path,
  er.created_at as uploaded_at,
  er.expiry_date,
  er.is_verified,
  er.verified_by,
  er.verified_at,
  CASE 
    WHEN er.id IS NULL THEN 'missing'
    WHEN tdr.requires_expiry AND er.expiry_date IS NOT NULL AND er.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN tdr.requires_expiry AND er.expiry_date IS NOT NULL AND er.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN er.is_verified = false THEN 'pending_verification'
    ELSE 'compliant'
  END as compliance_status
FROM users u
INNER JOIN employee_document_assignments eda ON (
  (eda.employee_id = u.id) OR 
  (eda.role = u.role) OR 
  (eda.team_id IN (SELECT team_id FROM team_memberships WHERE user_id = u.id))
)
INNER JOIN employee_document_templates edt ON edt.id = eda.template_id
INNER JOIN template_document_requirements tdr ON tdr.template_id = edt.id
LEFT JOIN employee_records er ON (
  er.employee_id = u.id AND 
  er.requirement_id = tdr.id
)
WHERE edt.is_active = true
  AND eda.organization_id = u.organization_id;

-- Grant select permissions
GRANT SELECT ON document_compliance_tracking TO authenticated;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_employee_document_assignments_org 
  ON employee_document_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_template_document_requirements_template 
  ON template_document_requirements(template_id);