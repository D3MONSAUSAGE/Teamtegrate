
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
  const { user } = useAuth();
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
    await sendMessage();
  };

  const handleLeaveChat = async () => {
    if (!user) return;
    setLeaving(true);

    try {
      // Remove user from participants
      const { error: participantError } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', user.id);

      if (participantError) {
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
    } catch (error) {
      console.error('Error leaving chat:', error);
      toast.error('Failed to leave the chat');
    } finally {
      setLeaving(false);
    }
  };
  
  const handleDeleteRoom = async () => {
    if (!user || !canDeleteRoom(room.created_by)) {
      toast.error('You do not have permission to delete this room');
      return;
    }
    
    try {
      // Delete all messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', room.id);
      
      if (messagesError) throw messagesError;
      
      // Delete all participants
      const { error: participantsError } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', room.id);
      
      if (participantsError) throw participantsError;
      
      // Delete the room
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', room.id);
      
      if (roomError) throw roomError;
      
      toast.success('Chat room deleted successfully');
      
      if (onRoomDeleted) onRoomDeleted();
      else if (onBack) onBack();
    } catch (error) {
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
    handleScroll,
    handleSendMessage,
    handleLeaveChat,
    handleDeleteRoom,
    handleReplyClick
  };
}
