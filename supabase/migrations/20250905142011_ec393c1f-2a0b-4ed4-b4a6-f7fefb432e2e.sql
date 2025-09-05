
-- Add metadata column to notifications and backfill
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Ensure existing rows are populated (safety if column was added nullable in past)
UPDATE public.notifications
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- Optional: index for metadata queries
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin
ON public.notifications
USING gin (metadata);
