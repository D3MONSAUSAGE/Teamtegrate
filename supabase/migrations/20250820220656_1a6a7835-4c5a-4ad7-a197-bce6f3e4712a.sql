-- Set up daily cron job to run auto-archive function
SELECT cron.schedule(
  'auto-archive-tasks-daily',
  '0 2 * * *', -- Run at 2 AM UTC daily
  $$
  SELECT
    net.http_post(
      url:='https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/auto-archive-tasks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);