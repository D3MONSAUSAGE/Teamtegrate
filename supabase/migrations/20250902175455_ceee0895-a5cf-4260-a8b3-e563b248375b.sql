-- Create migration function to convert legacy folders to database records
CREATE OR REPLACE FUNCTION migrate_legacy_folders_to_database(target_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  folder_record RECORD;
  new_folder_id uuid;
  migration_results jsonb := '{"migrated_folders": 0, "updated_documents": 0, "errors": []}'::jsonb;
  folder_count integer := 0;
  doc_count integer := 0;
BEGIN
  -- Get distinct legacy folders for the organization
  FOR folder_record IN 
    SELECT DISTINCT 
      folder as folder_name,
      team_id,
      MIN(created_at) as first_created,
      MIN(user_id::uuid) as creator_id
    FROM documents 
    WHERE organization_id = target_organization_id 
      AND folder IS NOT NULL 
      AND folder != ''
      AND folder_id IS NULL  -- Only migrate folders that haven't been migrated yet
    GROUP BY folder, team_id
  LOOP
    -- Check if folder already exists in database
    SELECT id INTO new_folder_id
    FROM folders 
    WHERE name = folder_record.folder_name 
      AND organization_id = target_organization_id
      AND COALESCE(team_id, 'null'::uuid) = COALESCE(folder_record.team_id, 'null'::uuid);
    
    -- Create folder if it doesn't exist
    IF new_folder_id IS NULL THEN
      INSERT INTO folders (
        name, 
        organization_id, 
        team_id, 
        created_by, 
        created_at,
        color
      ) VALUES (
        folder_record.folder_name,
        target_organization_id,
        folder_record.team_id,
        folder_record.creator_id,
        folder_record.first_created,
        '#6366f1'
      ) RETURNING id INTO new_folder_id;
      
      folder_count := folder_count + 1;
    END IF;
    
    -- Update documents to reference the new folder
    UPDATE documents 
    SET folder_id = new_folder_id
    WHERE organization_id = target_organization_id
      AND folder = folder_record.folder_name
      AND COALESCE(team_id, 'null'::uuid) = COALESCE(folder_record.team_id, 'null'::uuid)
      AND folder_id IS NULL;
    
    GET DIAGNOSTICS doc_count = ROW_COUNT;
    migration_results := jsonb_set(
      migration_results, 
      '{updated_documents}', 
      (COALESCE((migration_results->>'updated_documents')::integer, 0) + doc_count)::text::jsonb
    );
  END LOOP;
  
  migration_results := jsonb_set(migration_results, '{migrated_folders}', folder_count::text::jsonb);
  
  RETURN migration_results;
END;
$$;