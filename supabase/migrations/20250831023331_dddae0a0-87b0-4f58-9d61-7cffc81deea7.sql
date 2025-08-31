-- Create bulletin_posts table for company announcements, policies, newsletters
CREATE TABLE public.bulletin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bulletin_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for bulletin posts
CREATE POLICY "Users can view posts in their organization" 
ON public.bulletin_posts 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers and admins can create posts" 
ON public.bulletin_posts 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

CREATE POLICY "Managers and admins can update their own posts" 
ON public.bulletin_posts 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

CREATE POLICY "Managers and admins can delete their own posts" 
ON public.bulletin_posts 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bulletin_posts_updated_at
BEFORE UPDATE ON public.bulletin_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();