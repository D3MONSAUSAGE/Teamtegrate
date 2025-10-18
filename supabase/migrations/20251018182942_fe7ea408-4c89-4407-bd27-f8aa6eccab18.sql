-- Update document_compliance_tracking view to include document_type
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
  COALESCE(er.is_verified, false) as is_verified,
  er.verified_by,
  er.verified_at,
  CASE 
    WHEN er.id IS NULL THEN 'missing'
    WHEN er.expiry_date IS NOT NULL AND er.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN er.expiry_date IS NOT NULL AND er.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN COALESCE(er.is_verified, false) = false THEN 'pending_verification'
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

-- Ensure proper permissions
GRANT SELECT ON document_compliance_tracking TO authenticated;