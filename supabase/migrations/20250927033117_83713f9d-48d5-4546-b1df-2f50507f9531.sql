-- Insert default label templates for inventory system
INSERT INTO public.label_templates (
  organization_id,
  name,
  description,
  category,
  template_data,
  dimensions,
  printer_type,
  is_default,
  is_active,
  created_by
) VALUES 
-- Basic Product Label Template
(
  (SELECT id FROM organizations LIMIT 1),
  'Basic Product Label',
  'Standard product label with name, SKU, and barcode',
  'product',
  '{"fields": [
    {"type": "text", "field": "name", "x": 10, "y": 10, "fontSize": 12, "fontWeight": "bold"},
    {"type": "text", "field": "sku", "x": 10, "y": 30, "fontSize": 10},
    {"type": "barcode", "field": "barcode", "x": 10, "y": 50, "width": 100, "height": 30, "format": "CODE128"}
  ]}',
  '{"width": 4, "height": 2}',
  'thermal',
  true,
  true,
  (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)
),
-- Lot Tracking Label Template
(
  (SELECT id FROM organizations LIMIT 1),
  'Lot Tracking Label',
  'Product label with lot number and expiration date',
  'lot',
  '{"fields": [
    {"type": "text", "field": "name", "x": 10, "y": 10, "fontSize": 11, "fontWeight": "bold"},
    {"type": "text", "field": "lot_number", "x": 10, "y": 25, "fontSize": 9, "prefix": "LOT: "},
    {"type": "text", "field": "expiration_date", "x": 10, "y": 35, "fontSize": 9, "prefix": "EXP: "},
    {"type": "barcode", "field": "barcode", "x": 10, "y": 50, "width": 80, "height": 25, "format": "CODE128"}
  ]}',
  '{"width": 3, "height": 2}',
  'thermal',
  true,
  true,
  (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)
),
-- QR Code Label Template
(
  (SELECT id FROM organizations LIMIT 1),
  'QR Code Label',
  'Compact label with QR code and basic info',
  'qr',
  '{"fields": [
    {"type": "text", "field": "name", "x": 60, "y": 10, "fontSize": 10, "fontWeight": "bold"},
    {"type": "text", "field": "sku", "x": 60, "y": 25, "fontSize": 8},
    {"type": "qr", "field": "barcode", "x": 10, "y": 10, "size": 40}
  ]}',
  '{"width": 2.5, "height": 1.5}',
  'thermal',
  true,
  true,
  (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)
),
-- Nutritional Label Template
(
  (SELECT id FROM organizations LIMIT 1),
  'Nutritional Facts',
  'FDA-compliant nutritional information label',
  'nutritional',
  '{"fields": [
    {"type": "text", "field": "name", "x": 10, "y": 10, "fontSize": 10, "fontWeight": "bold"},
    {"type": "text", "field": "serving_size", "x": 10, "y": 25, "fontSize": 8, "prefix": "Serving: "},
    {"type": "text", "field": "calories", "x": 10, "y": 35, "fontSize": 8, "prefix": "Calories: "},
    {"type": "barcode", "field": "barcode", "x": 10, "y": 120, "width": 100, "height": 20, "format": "CODE128"}
  ]}',
  '{"width": 4, "height": 6}',
  'inkjet',
  true,
  true,
  (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)
);