
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { playChatNotification } from "@/utils/chatSounds";

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
  const soundSettings = useSoundSettings();

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

  const subscribeToMessages = useCallback(() => {
    console.log('Subscribing to chat messages with sound settings:', { enabled: soundSettings.enabled, volume: soundSettings.volume });
    
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
        (payload) => {
          fetchMessages();
          
          // Play sound for new messages from others
          if (payload.eventType === "INSERT" && payload.new?.user_id !== userId) {
            console.log('New message received, playing notification sound');
            playChatNotification(soundSettings);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from chat messages');
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, soundSettings.enabled, soundSettings.volume]);

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
    
    // Validate required inputs
    if ((!newMessage.trim() && fileUploads.length === 0) || !userId || isSending) return;
    
    setIsSending(true);
    try {
      // First prepare attachments if any
      let attachments = [];
      if (fileUploads.length > 0) {
        try {
          attachments = await Promise.all(fileUploads.map(upload => uploadFile(upload.file)));
        } catch (error) {
          console.error('Error uploading files:', error);
          toast.error('Failed to upload one or more files');
          setIsSending(false);
          return;
        }
      }

      // Then create the message
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

      // Finally add attachments if any
      if (attachments.length > 0 && messageData) {
        const attachmentRecords = attachments.map(attachment => ({
          message_id: messageData.id,
          ...attachment
        }));

        const { error: attachmentError } = await supabase
          .from('chat_message_attachments')
          .insert(attachmentRecords);

        if (attachmentError) {
          console.error('Error adding attachments:', attachmentError);
          toast.error('Message sent, but attachments could not be added');
        }
      }

      // Reset states on success
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
  };

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe();
    };
  }, [roomId, userId, subscribeToMessages]);

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
