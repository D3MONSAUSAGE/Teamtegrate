
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatAttachment } from "./useChatFileUpload";

export function useChatSendMessage(roomId: string, userId: string | undefined) {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (
    content: string,
    parentId: string | undefined,
    attachments: ChatAttachment[] = []
  ) => {
    if ((!content.trim() && attachments.length === 0) || !userId) {
      return;
    }

    setIsSending(true);

    try {
      // Create message
      const messagePayload = {
        room_id: roomId,
        user_id: userId,
        content: content.trim() || 'Shared attachments',
        type: 'text' as const,
        parent_id: parentId || null,
      };

      const { error: messageError, data: messageData } = await supabase
        .from('chat_messages')
        .insert(messagePayload)
        .select()
        .single();

      if (messageError) throw messageError;

      // Attach files if any
      if (attachments.length > 0 && messageData) {
        const attachmentRecords = attachments.map(attachment => ({
          message_id: messageData.id,
          ...attachment,
        }));

        const { error: attachmentError } = await supabase
          .from('chat_message_attachments')
          .insert(attachmentRecords);

        if (attachmentError) {
          console.error('Error adding attachments:', attachmentError);
          toast.error('Message sent, but attachments could not be added');
        }
      }

      return messageData;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return { sendMessage, isSending };
}
