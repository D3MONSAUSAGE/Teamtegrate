-- Create trigger to automatically set organization_id for message_reactions
CREATE OR REPLACE FUNCTION public.set_message_reaction_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message_reactions
DROP TRIGGER IF EXISTS set_message_reaction_org_trigger ON public.message_reactions;
CREATE TRIGGER set_message_reaction_org_trigger
  BEFORE INSERT ON public.message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_message_reaction_org();

-- Create trigger to automatically set organization_id for chat_attachments
CREATE OR REPLACE FUNCTION public.set_chat_attachment_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for chat_attachments (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_attachments' AND column_name = 'organization_id'
  ) THEN
    DROP TRIGGER IF EXISTS set_chat_attachment_org_trigger ON public.chat_attachments;
    EXECUTE 'CREATE TRIGGER set_chat_attachment_org_trigger
      BEFORE INSERT ON public.chat_attachments
      FOR EACH ROW
      EXECUTE FUNCTION public.set_chat_attachment_org()';
  END IF;
END $$;