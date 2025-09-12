-- Create FCM tokens table for Firebase Cloud Messaging
CREATE TABLE public.fcm_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for FCM tokens
CREATE POLICY "Users can view their own FCM tokens" 
ON public.fcm_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own FCM tokens" 
ON public.fcm_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens" 
ON public.fcm_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens" 
ON public.fcm_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON public.fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_fcm_tokens_platform ON public.fcm_tokens(platform);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fcm_tokens_updated_at
BEFORE UPDATE ON public.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to cleanup old/inactive FCM tokens
CREATE OR REPLACE FUNCTION public.cleanup_fcm_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark tokens as inactive if they haven't been updated in 30 days
  UPDATE public.fcm_tokens 
  SET is_active = false 
  WHERE updated_at < NOW() - INTERVAL '30 days' 
    AND is_active = true;
    
  -- Delete tokens that have been inactive for 90 days
  DELETE FROM public.fcm_tokens 
  WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Function to register or update FCM token
CREATE OR REPLACE FUNCTION public.register_fcm_token(
  p_token TEXT,
  p_platform TEXT,
  p_device_info JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_id UUID;
  user_org_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id 
  FROM public.users 
  WHERE id = auth.uid();
  
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or no organization assigned';
  END IF;
  
  -- Insert or update token
  INSERT INTO public.fcm_tokens (user_id, organization_id, token, platform, device_info, is_active)
  VALUES (auth.uid(), user_org_id, p_token, p_platform, p_device_info, true)
  ON CONFLICT (token) DO UPDATE SET
    user_id = auth.uid(),
    platform = p_platform,
    device_info = p_device_info,
    is_active = true,
    updated_at = now()
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$;