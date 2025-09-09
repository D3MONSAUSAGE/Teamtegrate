-- Fix request types organization_id to match the actual organization
UPDATE request_types 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '00000000-0000-0000-0000-000000000000';