
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFileToSupabase, ChatAttachment } from "./useChatFileUpload";

interface FileUpload {
  file: File;
  progress: number;
}

export async function sendChatMessage(
  e: React.FormEvent,
  {
    newMessage,
    fileUploads,
    setIsSending,
    setNewMessage,
    setFileUploads,
    setReplyTo,
    roomId,
    userId,
    replyTo,
  }: {
    newMessage: string,
    fileUploads: FileUpload[],
    setIsSending: (v: boolean) => void,
    setNewMessage: (v: string) => void,
    setFileUploads: (v: FileUpload[]) => void,
    setReplyTo: (v: any) => void,
    roomId: string,
    userId: string | undefined,
    replyTo: any,
  }
) {
  e.preventDefault();

  if ((!newMessage.trim() && fileUploads.length === 0) || !userId) return;

  setIsSending(true);

  try {
    let attachments: ChatAttachment[] = [];
    if (fileUploads.length > 0) {
      try {
        attachments = await Promise.all(
          fileUploads.map(upload => uploadFileToSupabase(upload.file, userId))
        );
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload one or more files');
        setIsSending(false);
        return;
      }
    }

    const messagePayload = {
      room_id: roomId,
      user_id: userId,
      content: newMessage.trim() || 'Shared attachments',
      type: 'text' as const,
      parent_id: replyTo ? replyTo.id : null,
    };

    const { error: messageError, data: messageData } = await supabase
      .from('chat_messages')
      .insert(messagePayload)
      .select()
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      toast.error(`Failed to send message: ${messageError.message}`);
      setIsSending(false);
      return;
    }

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

    setNewMessage('');
    setFileUploads([]);
    setReplyTo(null);
    toast.success('Message sent successfully');
  } catch (error) {
    console.error('Unexpected error sending message:', error);
    toast.error('Failed to send message due to an unexpected error');
  } finally {
    setIsSending(false);
  }
}
