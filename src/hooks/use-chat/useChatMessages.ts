
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

const MESSAGES_PER_PAGE = 20;

export function useChatMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchAndSetMessages = useCallback(async (append = false) => {
    if (!roomId) return;
    
    if (!append) {
      setIsLoading(true);
    }
    
    try {
      const msgs = await fetchMessages(roomId, MESSAGES_PER_PAGE, page * MESSAGES_PER_PAGE);
      
      if (append) {
        setMessages(prevMessages => [...msgs, ...prevMessages]);
      } else {
        setMessages(msgs);
      }
      
      setHasMoreMessages(msgs.length === MESSAGES_PER_PAGE);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [roomId, page, isInitialLoad]);

  const fetchMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoading) return;
    
    setPage(prev => prev + 1);
    await fetchAndSetMessages(true);
  }, [hasMoreMessages, isLoading, fetchAndSetMessages]);

  useEffect(() => {
    // Reset state when room changes
    setMessages([]);
    setPage(0);
    setHasMoreMessages(true);
    setIsInitialLoad(true);
    
    fetchAndSetMessages();
  }, [roomId]);

  return { 
    messages, 
    fetchAndSetMessages, 
    setMessages,
    isLoading,
    hasMoreMessages,
    fetchMoreMessages
  };
}
