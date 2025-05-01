
import { useState, useEffect, useCallback } from 'react';
import { useChatMessages } from './use-chat/useChatMessages';
import { useChatSendMessage } from './use-chat/useChatSendMessage'; 
import { useChatSubscription } from './use-chat/useChatSubscription';
import { useChatFileUpload } from './use-chat/useChatFileUpload';

export function useChat(roomId: string, userId?: string) {
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [fileUploads, setFileUploads] = useState<File[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Use custom hooks
  const { 
    messages, 
    isLoading, 
    setMessages,
    hasMoreMessages,
    loadMoreMessages
  } = useChatMessages(roomId);
  
  const { sendTypingStatus, typingTimeout } = useChatSubscription(roomId, userId, setTypingUsers, setMessages);
  const { uploadFiles } = useChatFileUpload();
  const { sendMessage: sendMessageToSupabase, isSending } = useChatSendMessage(roomId, userId);
  
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
  
  // Send message
  const sendMessage = useCallback(async () => {
    if ((!newMessage && fileUploads.length === 0) || !userId) return;
    
    try {
      // Clear typing timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
      
      // Upload files if any
      let attachments: { file_path: string; file_name: string; file_size: number; file_type: string }[] = [];
      
      if (fileUploads.length > 0) {
        attachments = await uploadFiles(fileUploads, roomId);
      }
      
      // Send message
      await sendMessageToSupabase(newMessage.trim(), replyTo?.id, attachments);
      
      // Reset state
      setNewMessage('');
      setReplyTo(null);
      setFileUploads([]);
      
      // Scroll to bottom
      setTimeout(() => {
        const messagesEnd = document.getElementById('messages-end');
        messagesEnd?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, roomId, userId, fileUploads, replyTo, sendMessageToSupabase, uploadFiles, typingTimeout]);
  
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
    isSending,
    hasMoreMessages,
    loadMoreMessages
  };
}
