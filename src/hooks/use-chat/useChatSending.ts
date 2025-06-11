
import { useState } from "react";
import { useChatSendMessage } from "./useChatSendMessage";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  type: "text" | "system";
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

export function useChatSending(
  roomId: string,
  userId: string | undefined
) {
  const [newMessage, setNewMessage] = useState("");
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const { sendMessage: sendMessageToSupabase, sending } = useChatSendMessage(roomId, userId);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && fileUploads.length === 0) || !userId) return;

    try {
      // Upload files if any and get attachments
      let attachments: { file_path: string; file_name: string; file_size: number; file_type: string }[] = [];
      
      // Send message with attachments
      await sendMessageToSupabase(newMessage.trim(), replyTo?.id, attachments);
      
      // Reset state
      setNewMessage("");
      setFileUploads([]);
      setReplyTo(null);
      
      // Scroll to bottom
      setTimeout(() => {
        const messagesEnd = document.getElementById('messages-end');
        messagesEnd?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    replyTo,
    setReplyTo,
    isSending: sending,
    sendMessage,
  };
}
