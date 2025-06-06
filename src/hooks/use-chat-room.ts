
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/hooks/use-chat';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  
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
    await sendMessage();
  };

  const handleLeaveChat = async () => {
    if (!user) return;
    setLeaving(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: user.id,
          content: `${user.email} has left the chat.`,
          type: 'system'
        });

      if (error) {
        throw error;
      } else {
        toast.success('Left chat room successfully');
        if (onBack) onBack();
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
      toast.error('Failed to leave the chat');
    } finally {
      setLeaving(false);
    }
  };
  
  const handleDeleteRoom = async () => {
    if (!user || !isCreator) return;
    setIsDeleting(true);
    
    try {
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', room.id);
      
      if (messagesError) throw messagesError;
      
      const { error: participantsError } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', room.id);
      
      if (participantsError) throw participantsError;
      
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
    } finally {
      setIsDeleting(false);
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
    isDeleting,
    isCreator,
    handleScroll,
    handleSendMessage,
    handleLeaveChat,
    handleDeleteRoom,
    handleReplyClick
  };
}
