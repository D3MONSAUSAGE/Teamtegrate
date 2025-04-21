
import { sendChatMessage } from "./useChatSendMessage";
import { useState } from "react";

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

interface SendMessageParams {
  roomId: string;
  userId: string | undefined;
  replyTo: Message | null;
}

export function useChatSending(
  roomId: string,
  userId: string | undefined
) {
  const [newMessage, setNewMessage] = useState("");
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && fileUploads.length === 0) || !userId) return;

    setIsSending(true);

    await sendChatMessage(e, {
      newMessage,
      fileUploads,
      setIsSending,
      setNewMessage,
      setFileUploads,
      setReplyTo,
      roomId,
      userId,
      replyTo,
    });
  };

  return {
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    replyTo,
    setReplyTo,
    isSending,
    sendMessage,
  };
}
