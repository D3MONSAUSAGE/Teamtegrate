-- Create POS system configurations with proper organization and user info
INSERT INTO pos_system_configs (organization_id, created_by, system_name, is_active, config_data) 
SELECT 
  u.organization_id,
  u.id,
  'brink',
  true,
  '{
    "patterns": {
      "grossSales": ["Gross Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Total Gross[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "netSales": ["Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Total Net[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "orderCount": ["Order Count[\\s:]*([0-9,]+)", "Total Orders[\\s:]*([0-9,]+)"],
      "totalCash": ["Total Cash[\\s:$]*([0-9,]+\\.?[0-9]*)", "Cash Total[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "nonCash": ["Non[\\-–—‑\\s]?Cash\\s+Payments?[\\s:$]*([0-9,]+\\.?[0-9]*)", "NON[\\-–—‑\\s]?CASH\\s+PAYMENTS?[\\s:$]*([0-9,]+\\.?[0-9]*)"]
    },
    "sectionHeaders": {
      "sales": ["Sales Summary", "Revenue Summary"],
      "labor": ["Labor Summary", "Employee Summary"],
      "payments": ["Payment Summary", "Tender Summary"]
    },
    "dateFormats": ["MMM dd, yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]
  }'::jsonb
FROM users u 
WHERE u.role IN ('superadmin', 'admin')
LIMIT 1;

-- Insert other POS systems using the same organization and user
INSERT INTO pos_system_configs (organization_id, created_by, system_name, is_active, config_data)
SELECT 
  organization_id,
  created_by,
  configs.system_name,
  true,
  configs.config_data
FROM pos_system_configs psc,
(VALUES
  ('square', '{
    "patterns": {
      "grossSales": ["Gross Amount[\\s:$]*([0-9,]+\\.?[0-9]*)", "Total Sales[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "netSales": ["Net Amount[\\s:$]*([0-9,]+\\.?[0-9]*)", "Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "orderCount": ["Transaction Count[\\s:]*([0-9,]+)", "Orders[\\s:]*([0-9,]+)"],
      "totalCash": ["Cash[\\s:$]*([0-9,]+\\.?[0-9]*)", "Cash Payments[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "nonCash": ["Card[\\s:$]*([0-9,]+\\.?[0-9]*)", "Electronic[\\s:$]*([0-9,]+\\.?[0-9]*)"]
    },
    "sectionHeaders": {
      "sales": ["Daily Summary", "Sales Report"],
      "labor": ["Staff Summary", "Employee Report"],
      "payments": ["Payment Methods", "Transaction Types"]
    },
    "dateFormats": ["MMM dd, yyyy", "MM/dd/yyyy"]
  }'::jsonb),
  ('toast', '{
    "patterns": {
      "grossSales": ["Total Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Gross Revenue[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "netSales": ["Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Revenue[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "orderCount": ["Orders[\\s:]*([0-9,]+)", "Check Count[\\s:]*([0-9,]+)"],
      "totalCash": ["Cash[\\s:$]*([0-9,]+\\.?[0-9]*)", "Cash Tender[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "nonCash": ["Credit Card[\\s:$]*([0-9,]+\\.?[0-9]*)", "Cards[\\s:$]*([0-9,]+\\.?[0-9]*)"]
    },
    "sectionHeaders": {
      "sales": ["Sales Report", "Revenue Report"],
      "labor": ["Labor Report", "Staff Report"],
      "payments": ["Payment Report", "Tender Report"]
    },
    "dateFormats": ["MMM dd, yyyy", "MM/dd/yyyy"]
  }'::jsonb),
  ('lightspeed', '{
    "patterns": {
      "grossSales": ["Gross Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Total Revenue[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "netSales": ["Net Revenue[\\s:$]*([0-9,]+\\.?[0-9]*)", "Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "orderCount": ["Transaction Count[\\s:]*([0-9,]+)", "Sale Count[\\s:]*([0-9,]+)"],
      "totalCash": ["Cash[\\s:$]*([0-9,]+\\.?[0-9]*)", "Cash Sales[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "nonCash": ["Credit[\\s:$]*([0-9,]+\\.?[0-9]*)", "Card[\\s:$]*([0-9,]+\\.?[0-9]*)"]
    },
    "sectionHeaders": {
      "sales": ["Sales Summary", "Revenue Summary"],
      "labor": ["Employee Summary", "Staff Summary"],
      "payments": ["Payment Summary", "Tender Summary"]
    },
    "dateFormats": ["MMM dd, yyyy", "dd/MM/yyyy"]
  }'::jsonb),
  ('clover', '{
    "patterns": {
      "grossSales": ["Gross Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Total Amount[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "netSales": ["Net Sales[\\s:$]*([0-9,]+\\.?[0-9]*)", "Net Amount[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "orderCount": ["Orders[\\s:]*([0-9,]+)", "Transactions[\\s:]*([0-9,]+)"],
      "totalCash": ["Cash[\\s:$]*([0-9,]+\\.?[0-9]*)", "Cash Payments[\\s:$]*([0-9,]+\\.?[0-9]*)"],
      "nonCash": ["Cards[\\s:$]*([0-9,]+\\.?[0-9]*)", "Electronic[\\s:$]*([0-9,]+\\.?[0-9]*)"]
    },
    "sectionHeaders": {
      "sales": ["Sales Report", "Revenue Report"],
      "labor": ["Staff Report", "Employee Report"],
      "payments": ["Payment Report", "Transaction Report"]
    },
    "dateFormats": ["MMM dd, yyyy", "MM/dd/yyyy"]
  }'::jsonb)
) AS configs(system_name, config_data)
WHERE psc.system_name = 'brink'
LIMIT 1;