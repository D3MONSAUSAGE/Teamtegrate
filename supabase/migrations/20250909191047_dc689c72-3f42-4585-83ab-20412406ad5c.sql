-- Add video source support to training modules
ALTER TABLE training_modules 
ADD COLUMN video_source text DEFAULT 'youtube'::text,
ADD CONSTRAINT valid_video_source CHECK (video_source IN ('youtube', 'google_drive', 'direct_link'));

-- Rename youtube_video_id to video_url for better generalization
ALTER TABLE training_modules 
RENAME COLUMN youtube_video_id TO video_url;

-- Update any existing records to have 'youtube' as the source
UPDATE training_modules 
SET video_source = 'youtube' 
WHERE video_url IS NOT NULL;