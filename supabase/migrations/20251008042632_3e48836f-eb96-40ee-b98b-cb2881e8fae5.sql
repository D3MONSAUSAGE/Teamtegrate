-- Fix Critical: Enable RLS on duplicate_sku_backup table
ALTER TABLE public.duplicate_sku_backup ENABLE ROW LEVEL SECURITY;

-- Add policy to restrict access to organization members only
CREATE POLICY "Users can view their organization's backup data"
ON public.duplicate_sku_backup
FOR SELECT
USING (organization_id = public.get_current_user_organization_id());

-- Prevent unauthorized modifications
CREATE POLICY "Only admins can modify backup data"
ON public.duplicate_sku_backup
FOR ALL
USING (
  organization_id = public.get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Fix: Add search_path to security definer functions that are missing it
-- Update set_chat_participant_org function
CREATE OR REPLACE FUNCTION public.set_chat_participant_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL OR NEW.room_id IS DISTINCT FROM OLD.room_id THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_rooms WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update set_message_reaction_org function
CREATE OR REPLACE FUNCTION public.set_message_reaction_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update set_chat_attachment_org function
CREATE OR REPLACE FUNCTION public.set_chat_attachment_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update set_quiz_organization function
CREATE OR REPLACE FUNCTION public.set_quiz_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.get_current_user_organization_id();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update set_nutritional_info_organization function
CREATE OR REPLACE FUNCTION public.set_nutritional_info_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL OR NEW.organization_id = '' THEN
    NEW.organization_id := public.get_current_user_organization_id();
  END IF;
  
  IF NEW.created_by IS NULL OR NEW.created_by = '' THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update set_onboarding_stage_org function
CREATE OR REPLACE FUNCTION public.set_onboarding_stage_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id 
    FROM public.onboarding_templates 
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$function$;