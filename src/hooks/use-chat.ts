
import { useState, useEffect, useCallback } from 'react';
import { useChatMessages } from './use-chat/useChatMessages';
import { useChatSendMessage } from './use-chat/useChatSendMessage';
import { useChatSubscription } from './use-chat/useChatSubscription';
import { useChatFileUpload, FileUpload } from './use-chat/useChatFileUpload';

export function useChat(roomId: string, userId?: string) {
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Use custom hooks
  const { 
    messages, 
    isLoading,
    setMessages,
    hasMoreMessages,
    fetchMoreMessages
  } = useChatMessages(roomId);
  
  const { sendTypingStatus, typingTimeout } = useChatSubscription(roomId, userId, setTypingUsers, setMessages);
  const { uploadFiles } = useChatFileUpload();
  const { sendMessage: sendMessageToSupabase, sending } = useChatSendMessage(roomId, userId);
  
  // Reset state when room changes
  useEffect(() => {
    setNewMessage('');
    setReplyTo(null);
    setFileUploads([]);
    setTypingUsers([]);
  }, [roomId]);
  
  // Send typing status when user types
  useEffect(() => {
    if (newMessage && userId) {
      sendTypingStatus();
    }
  }, [newMessage, userId, sendTypingStatus]);
  
  // Send message with optimistic updates
  const sendMessage = useCallback(async () => {
    if ((!newMessage && fileUploads.length === 0) || !userId) return;
    
    try {
      // Clear typing timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
      
      // Store current values before clearing state
      const messageContent = newMessage.trim();
      const currentReplyTo = replyTo;
      const currentFileUploads = [...fileUploads];
      
      // Optimistically add message to state immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        room_id: roomId,
        user_id: userId,
        content: messageContent || 'Shared attachments',
        type: 'text' as const,
        created_at: new Date().toISOString(),
        parent_id: currentReplyTo?.id || null,
        sending: true // Flag to indicate this is being sent
      };
      
      // Clear form state immediately for better UX
      setNewMessage('');
      setReplyTo(null);
      setFileUploads([]);
      
      // Add optimistic message
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Upload files if any
      let attachments: { file_path: string; file_name: string; file_size: number; file_type: string }[] = [];
      
      if (currentFileUploads.length > 0) {
        attachments = await uploadFiles(currentFileUploads, roomId);
      }
      
      // Send message to database
      const sentMessage = await sendMessageToSupabase(messageContent, currentReplyTo?.id, attachments);
      
      if (sentMessage) {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage : msg
        ));
      } else {
        // Remove optimistic message if send failed
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      // Restore form state on error
      setNewMessage(newMessage);
      setReplyTo(replyTo);
      setFileUploads(fileUploads);
    }
  }, [newMessage, roomId, userId, fileUploads, replyTo, sendMessageToSupabase, uploadFiles, typingTimeout, setMessages]);
  
  return {
    messages,
    isLoading,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    sendMessage,
    replyTo,
    setReplyTo,
    typingUsers,
    isSending: sending,
    hasMoreMessages,
    loadMoreMessages: fetchMoreMessages
  };
}
