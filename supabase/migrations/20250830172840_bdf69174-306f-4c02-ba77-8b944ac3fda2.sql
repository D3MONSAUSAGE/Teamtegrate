-- Add video tracking fields to user_training_progress table
ALTER TABLE user_training_progress 
ADD COLUMN IF NOT EXISTS video_progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS video_watch_time_seconds INTEGER DEFAULT 0;

-- Update content_type to have proper enum values for training_modules
ALTER TABLE training_modules 
DROP CONSTRAINT IF EXISTS content_type_check;

ALTER TABLE training_modules 
ADD CONSTRAINT content_type_check 
CHECK (content_type IN ('text', 'video', 'mixed'));