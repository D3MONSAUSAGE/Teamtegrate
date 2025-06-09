
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/hooks/use-chat';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatRoomData {
  id: string;
  name: string;
  created_by: string;
}

export function useChatRoom(room: ChatRoomData, onBack?: () => void, onRoomDeleted?: () => void) {
  const { user, logout, isAuthenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { canDeleteRoom } = useChatPermissions();
  
  const {
    messages,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    sendMessage,
    replyTo,
    setReplyTo,
    isSending,
    typingUsers,
    isLoading,
    hasMoreMessages,
    loadMoreMessages
  } = useChat(room.id, user?.id);

  const [leaving, setLeaving] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Check if current user is the creator of the room
  const isCreator = user?.id === room.created_by;

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    
    if (scrollTop < 50 && hasMoreMessages) {
      loadMoreMessages();
    }
    
    const { scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setAutoScrollEnabled(isNearBottom);
  };

  useEffect(() => {
    if (messages.length > 0 && (autoScrollEnabled || !initialScrollDone)) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
        setInitialScrollDone(true);
      });
    }
  }, [messages.length, autoScrollEnabled, initialScrollDone]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in to send messages');
      return;
    }
    
    try {
      await sendMessage();
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        toast.error('Session expired. Please log in again.');
        await logout();
      } else {
        toast.error('Failed to send message');
      }
    }
  };

  const handleLeaveChat = async () => {
    if (!user || !isAuthenticated) return;
    setLeaving(true);

    try {
      // Test session first
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        toast.error('Session expired. Please log in again.');
        await logout();
        return;
      }

      // Remove user from participants
      const { error: participantError } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', user.id);

      if (participantError) {
        if (participantError.message.includes('JWT') || participantError.message.includes('auth')) {
          toast.error('Session expired. Please log in again.');
          await logout();
          return;
        }
        throw participantError;
      }

      // Add system message about leaving
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: user.id,
          content: `${user.email} has left the chat.`,
          type: 'system'
        });

      if (messageError) {
        console.error('Error adding leave message:', messageError);
        // Don't throw error as the main action (leaving) succeeded
      }

      toast.success('Left chat room successfully');
      if (onBack) onBack();
    } catch (error: any) {
      console.error('Error leaving chat:', error);
      toast.error('Failed to leave the chat');
    } finally {
      setLeaving(false);
    }
  };
  
  const handleDeleteRoom = async () => {
    if (!user || !canDeleteRoom(room.created_by) || !isAuthenticated) {
      toast.error('You do not have permission to delete this room');
      return;
    }
    
    try {
      // Test session first
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        toast.error('Session expired. Please log in again.');
        await logout();
        return;
      }

      // Delete all messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', room.id);
      
      if (messagesError) {
        if (messagesError.message.includes('JWT') || messagesError.message.includes('auth')) {
          toast.error('Session expired. Please log in again.');
          await logout();
          return;
        }
        throw messagesError;
      }
      
      // Delete all participants
      const { error: participantsError } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', room.id);
      
      if (participantsError) {
        if (participantsError.message.includes('JWT') || participantsError.message.includes('auth')) {
          toast.error('Session expired. Please log in again.');
          await logout();
          return;
        }
        throw participantsError;
      }
      
      // Delete the room
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', room.id);
      
      if (roomError) {
        if (roomError.message.includes('JWT') || roomError.message.includes('auth')) {
          toast.error('Session expired. Please log in again.');
          await logout();
          return;
        }
        throw roomError;
      }
      
      toast.success('Chat room deleted successfully');
      
      if (onRoomDeleted) onRoomDeleted();
      else if (onBack) onBack();
    } catch (error: any) {
      console.error('Error deleting chat room:', error);
      toast.error('Failed to delete the chat room');
      throw error; // Re-throw to handle loading state in component
    }
  };

  const handleReplyClick = (message: any) => {
    setReplyTo(message);
  };

  return {
    user,
    messagesEndRef,
    scrollAreaRef,
    isMobile,
    messages,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    replyTo,
    setReplyTo,
    isSending,
    typingUsers,
    isLoading,
    hasMoreMessages,
    loadMoreMessages,
    leaving,
    isCreator,
    handleScroll,
    handleSendMessage,
    handleLeaveChat,
    handleDeleteRoom,
    handleReplyClick
  };
}
