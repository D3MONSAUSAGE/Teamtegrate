
import { useEffect } from "react";
import { useChatMessages } from "./use-chat/useChatMessages";
import { useChatSending } from "./use-chat/useChatSending";
import { useChatSubscription } from "./use-chat/useChatSubscription";

export const useChat = (roomId: string, userId: string | undefined) => {
  const { messages, fetchAndSetMessages, setMessages } = useChatMessages(roomId);
  const {
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    replyTo,
    setReplyTo,
    isSending,
    sendMessage,
  } = useChatSending(roomId, userId);

  const subscribeToMessages = useChatSubscription(roomId, userId, fetchAndSetMessages);

  useEffect(() => {
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
    isSending,
  };
};
