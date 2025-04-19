
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  type: 'text' | 'system';
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

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data);
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
    if ((!newMessage.trim() && fileUploads.length === 0) || !userId) return;

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
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
    sendMessage
  };
};
