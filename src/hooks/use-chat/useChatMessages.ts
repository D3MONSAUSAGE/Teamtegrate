
import { useState, useEffect, useCallback } from "react";
import { fetchMessages } from "./useChatFetch";

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

export function useChatMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchAndSetMessages = useCallback(async () => {
    const msgs = await fetchMessages(roomId);
    setMessages(msgs);
  }, [roomId]);

  useEffect(() => {
    fetchAndSetMessages();
  }, [fetchAndSetMessages]);

  return { messages, fetchAndSetMessages, setMessages };
}
