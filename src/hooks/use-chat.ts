
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  type: 'text' | 'system';
  parent_id?: string;
  attachments?: {
    id: string;
    file_name: string;
    file_type: string;
    file_path: string;
  }[];
}

interface FileUpload {
  file: File;
  progress: number;
}

export const useChat = (roomId: string, userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('chat_message_attachments')
        .select('*');

      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
        return;
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

      setMessages(messagesWithAttachments);
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const uploadFile = async (file: File) => {
    if (!userId) {
      throw new Error("User ID is required to upload files");
    }
    
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${timestamp}-${file.name}`;

    const { error: uploadError, data } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      throw uploadError;
    }

    return {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && fileUploads.length === 0) || !userId || isSending) return;
    
    setIsSending(true);
    try {
      let attachments = [];
      if (fileUploads.length > 0) {
        attachments = await Promise.all(fileUploads.map(upload => uploadFile(upload.file)));
      }

      const { error: messageError, data: messageData } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: userId,
          content: newMessage.trim() || 'Shared attachments',
          type: 'text',
          parent_id: replyTo ? replyTo.id : null,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (attachments.length > 0) {
        const { error: attachmentError } = await supabase
          .from('chat_message_attachments')
          .insert(
            attachments.map(attachment => ({
              message_id: messageData.id,
              ...attachment
            }))
          );

        if (attachmentError) throw attachmentError;
      }

      setNewMessage('');
      setFileUploads([]);
      setReplyTo(null);
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return {
    messages,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    sendMessage,
    replyTo,
    setReplyTo,
    isSending
  };
};
