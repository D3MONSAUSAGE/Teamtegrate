
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types must be shared with parent
export async function fetchMessages(roomId: string) {
  try {
    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return [];
    }

    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from('chat_message_attachments')
      .select('*');

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError);
      return [];
    }

    const messagesWithAttachments = messagesData.map(message => {
      const messageAttachments = attachmentsData.filter(
        attachment => attachment.message_id === message.id
      );

      return {
        ...message,
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined
      };
    });

    return messagesWithAttachments;
  } catch (error) {
    console.error('Unexpected error fetching messages:', error);
    toast.error('Failed to load messages');
    return [];
  }
}
