
-- Add updated_at trigger for comments table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for comments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
        CREATE TRIGGER update_comments_updated_at
            BEFORE UPDATE ON comments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Add category and metadata columns to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add RLS policy for deleting own comments
CREATE POLICY "Users can delete their own comments in organization" 
ON comments FOR DELETE 
USING (
    organization_id = get_current_user_organization_id() 
    AND user_id = auth.uid()
);

-- Add function to get comment stats for a project
CREATE OR REPLACE FUNCTION get_project_comment_stats(project_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_comments', COUNT(*),
        'recent_comments', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
        'pinned_comments', COUNT(*) FILTER (WHERE is_pinned = true),
        'categories', json_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL)
    ) INTO stats
    FROM comments 
    WHERE project_id = project_id_param 
    AND organization_id = get_current_user_organization_id();
    
    RETURN stats;
END;
$$;
