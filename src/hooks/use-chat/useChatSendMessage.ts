
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatAttachment } from "./useChatFileUpload";
import { createChatMessageNotification } from "@/contexts/task/operations/assignment/createChatNotification";
import { useAuth } from "@/contexts/AuthContext";
import { validateUserOrganization, addOrgIdToInsert } from "@/utils/organizationHelpers";

export function useChatSendMessage(roomId: string, userId: string | undefined) {
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (
    content: string,
    parentId: string | undefined,
    attachments: ChatAttachment[] = []
  ) => {
    if ((!content.trim() && attachments.length === 0) || !userId || !user) {
      return;
    }

    try {
      if (!validateUserOrganization(user)) {
        toast.error('User must belong to an organization to send messages');
        return;
      }
    } catch (error) {
      toast.error('User must belong to an organization to send messages');
      return;
    }

    setIsSending(true);

    try {
      // Create message payload with organization_id
      const messagePayload = {
        room_id: roomId,
        user_id: userId,
        content: content.trim() || 'Shared attachments',
        type: 'text' as const,
        parent_id: parentId || null,
      };

      const insertData = addOrgIdToInsert(messagePayload, user);

      // Insert message and get the result
      const { error: messageError, data: messageData } = await supabase
        .from('chat_messages')
        .insert(insertData)
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

      // Get room name and user info for notifications
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', roomId)
        .eq('organization_id', user.organization_id)
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .eq('organization_id', user.organization_id)
        .single();

      // Create notifications for other participants
      if (roomData && userData) {
        await createChatMessageNotification(
          roomId,
          userId,
          userData.name,
          roomData.name,
          content.trim() || 'Shared attachments'
        );
      }

      // Return the message data for optimistic updates
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
