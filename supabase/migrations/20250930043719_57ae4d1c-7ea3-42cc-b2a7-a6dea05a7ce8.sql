-- ============================================
-- PHASE 2: DATA MIGRATION V1 TO V2 (FIXED ENUM CASTING)
-- ============================================

-- Step 1: Migrate templates
INSERT INTO checklist_templates_v2 (
  org_id,
  name,
  description,
  priority,
  assignment_type,
  role_key,
  start_time,
  end_time,
  scheduled_days,
  require_verification,
  scoring_enabled,
  created_by,
  is_active,
  created_at,
  updated_at
)
SELECT 
  c.organization_id,
  c.name,
  c.description,
  c.priority::text,
  'team'::assignment_type_v2,
  CASE WHEN c.assignment_type::text = 'role' THEN 'team_leader' ELSE NULL END,
  c.execution_window_start::time,
  c.execution_window_end::time,
  COALESCE(
    CASE 
      WHEN jsonb_typeof(c.scheduled_days) = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(c.scheduled_days))
      ELSE ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    END,
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  ),
  c.verification_required,
  c.scoring_enabled,
  c.created_by,
  (c.status::text = 'active'),
  c.created_at,
  c.updated_at
FROM checklists c
WHERE c.status::text != 'archived'
AND NOT EXISTS (
  SELECT 1 FROM checklist_templates_v2 ct2
  WHERE ct2.name = c.name 
  AND ct2.org_id = c.organization_id
);

-- Step 2: Migrate items
INSERT INTO checklist_template_items_v2 (
  template_id,
  label,
  instructions,
  position,
  requires_photo,
  requires_note,
  created_at
)
SELECT 
  ct2.id,
  ci.title,
  ci.description,
  ci.order_index,
  false,
  false,
  ci.created_at
FROM checklist_items ci
JOIN checklists c ON c.id = ci.checklist_id
JOIN checklist_templates_v2 ct2 ON ct2.name = c.name AND ct2.org_id = c.organization_id
WHERE c.status::text != 'archived'
AND NOT EXISTS (
  SELECT 1 FROM checklist_template_items_v2 cti2
  WHERE cti2.template_id = ct2.id
  AND cti2.label = ci.title
  AND cti2.position = ci.order_index
)
ORDER BY ci.checklist_id, ci.order_index;

-- Log migration
CREATE TABLE IF NOT EXISTS checklist_v1_to_v2_migration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migrated_at timestamp with time zone DEFAULT now(),
  templates_migrated integer,
  items_migrated integer,
  notes text
);

INSERT INTO checklist_v1_to_v2_migration_log (templates_migrated, items_migrated, notes)
VALUES (
  (SELECT COUNT(*) FROM checklist_templates_v2),
  (SELECT COUNT(*) FROM checklist_template_items_v2),
  'Migration completed at ' || NOW()::text
);