-- Add acceptance tracking fields to requests table
ALTER TABLE public.requests 
ADD COLUMN accepted_by UUID REFERENCES auth.users(id),
ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completion_notes TEXT;

-- Create request_updates table for progress tracking
CREATE TABLE public.request_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'progress', -- 'progress', 'status_change', 'assignment'
  title TEXT NOT NULL,
  content TEXT,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on request_updates
ALTER TABLE public.request_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for request_updates
CREATE POLICY "Users can view updates in their organization" ON public.request_updates
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create updates for assigned requests" ON public.request_updates
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.requests r 
      WHERE r.id = request_id 
      AND (r.assigned_to = auth.uid()::text OR auth.uid() = ANY(string_to_array(r.assigned_to, ',')::uuid[]))
    )
  );

-- Add indexes for performance
CREATE INDEX idx_request_updates_request_id ON public.request_updates(request_id);
CREATE INDEX idx_request_updates_user_id ON public.request_updates(user_id);
CREATE INDEX idx_request_updates_created_at ON public.request_updates(created_at DESC);

-- Update request types to support parent-child relationships for categories/subcategories
ALTER TABLE public.request_types 
ADD COLUMN parent_id UUID REFERENCES public.request_types(id),
ADD COLUMN is_subcategory BOOLEAN DEFAULT false,
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add index for hierarchical queries
CREATE INDEX idx_request_types_parent_id ON public.request_types(parent_id);

-- Trigger to update updated_at timestamp on request_updates
CREATE TRIGGER update_request_updates_updated_at
  BEFORE UPDATE ON public.request_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-assign based on request acceptance
CREATE OR REPLACE FUNCTION public.handle_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When someone accepts a request, remove other potential assignees
  IF NEW.accepted_by IS NOT NULL AND OLD.accepted_by IS NULL THEN
    -- Update status to in_progress
    NEW.status = 'in_progress';
    NEW.accepted_at = now();
    
    -- Clear other assignees and keep only the one who accepted
    NEW.assigned_to = NEW.accepted_by::text;
    
    -- Log the acceptance as an update
    INSERT INTO public.request_updates (
      organization_id, request_id, user_id, update_type, 
      title, content, old_status, new_status
    ) VALUES (
      NEW.organization_id, NEW.id, NEW.accepted_by, 'assignment',
      'Request Accepted', 'This request has been accepted and is now in progress.',
      OLD.status, 'in_progress'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for request acceptance
CREATE TRIGGER trigger_request_acceptance
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_request_acceptance();