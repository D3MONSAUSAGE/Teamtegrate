
import { useState, useEffect } from 'react';
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { fetchMessages } from "./use-chat/useChatFetch";
import { useChatSubscribe } from "./use-chat/useChatSubscribe";
import { sendChatMessage } from "./use-chat/useChatSendMessage";

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

  const fetchAndSetMessages = async () => {
    const msgs = await fetchMessages(roomId);
    setMessages(msgs);
  };

  const subscribeToMessages = useChatSubscribe(fetchAndSetMessages, roomId, userId, soundSettings);

  const sendMessage = async (e: React.FormEvent) => {
    await sendChatMessage(e, {
      newMessage,
      fileUploads,
      setIsSending,
      setNewMessage,
      setFileUploads,
      setReplyTo,
      roomId,
      userId,
      replyTo
    });
  };

  useEffect(() => {
    fetchAndSetMessages();
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
