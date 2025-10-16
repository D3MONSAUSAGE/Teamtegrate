-- Update Canyon team manager from Francisco Lopez to Daniel Sandria
UPDATE teams 
SET manager_id = '2f644b4b-73e5-424f-acc4-05b918626c27',
    updated_at = now()
WHERE id = '75bddbb8-b044-4047-879c-26cad3cc2212'
  AND organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08';