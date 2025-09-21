-- Add scheduling and configuration fields to inventory_templates table
ALTER TABLE public.inventory_templates 
ADD COLUMN execution_frequency text DEFAULT 'manual',
ADD COLUMN execution_days text[] DEFAULT ARRAY[]::text[],
ADD COLUMN execution_time_start time,
ADD COLUMN execution_time_due time,
ADD COLUMN auto_assign_enabled boolean DEFAULT false,
ADD COLUMN notification_settings jsonb DEFAULT '{}'::jsonb,
ADD COLUMN execution_window_hours integer DEFAULT 24,
ADD COLUMN priority text DEFAULT 'medium',
ADD COLUMN category text DEFAULT 'general';

-- Add constraint to ensure valid execution frequency
ALTER TABLE public.inventory_templates 
ADD CONSTRAINT valid_execution_frequency 
CHECK (execution_frequency IN ('manual', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'));

-- Add constraint to ensure valid priority
ALTER TABLE public.inventory_templates 
ADD CONSTRAINT valid_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add index for better performance on scheduled template queries
CREATE INDEX idx_inventory_templates_schedule ON public.inventory_templates (execution_frequency, auto_assign_enabled) WHERE is_active = true;