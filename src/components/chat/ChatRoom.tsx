
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessageInput from './ChatMessageInput';
import { useChat } from '@/hooks/use-chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChatRoomHeader from './ChatRoomHeader';
import ChatMessageGroups from './ChatMessageGroups';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatMessageLoader from './ChatMessageLoader';
import ChatRoomActions from './ChatRoomActions';
import { FileUpload } from '@/hooks/use-chat/useChatFileUpload';

interface ChatRoomProps {
  room: {
    id: string;
    name: string;
    created_by: string;
  };
  onBack?: () => void;
  onRoomDeleted?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, onBack, onRoomDeleted }) => {
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

  const msgMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of messages) {
      map[m.id] = m;
    }
    return map;
  }, [messages]);

  const handleReplyClick = (message: any) => {
    setReplyTo(message);
  };

  const getMessageDate = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toDateString();
  };

  const groupedMessages = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    messages.forEach(msg => {
      const date = msg.created_at ? getMessageDate(msg.created_at) : 'No Date';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return Object.entries(groups);
  }, [messages]);

  return (
    <Card className="flex flex-col h-full border-border dark:border-gray-800 shadow-none bg-background dark:bg-[#111827] overflow-hidden">
      <ChatRoomHeader
        room={room}
        isMobile={isMobile}
        currentUserId={user?.id}
        onBack={onBack}
        toggleParticipants={() => {}} // Remove drawer functionality
        onLeave={handleLeaveChat}
        onDelete={() => setIsDeleting(true)}
        leaving={leaving}
        canDelete={isCreator}
      />

      <ChatRoomActions
        roomId={room.id}
        isCreator={isCreator}
        handleDeleteRoom={handleDeleteRoom}
        isDeleting={isDeleting}
      />

      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-3 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] dark:bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_f1e8c06e8d4e3296352ae4682c0632c3.png')] bg-repeat"
        onScroll={handleScroll}
      >
        <ChatMessageLoader 
          isLoading={isLoading}
          hasMoreMessages={hasMoreMessages}
          loadMoreMessages={loadMoreMessages}
        />
        
        <ChatMessageGroups
          groupedMessages={groupedMessages}
          msgMap={msgMap}
          userId={user?.id}
          onReplyClick={handleReplyClick}
        />
        
        <div ref={messagesEndRef} />
      </ScrollArea>

      <ChatTypingIndicator typingUsers={typingUsers} />

      <ChatMessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        fileUploads={fileUploads}
        setFileUploads={setFileUploads}
        onSubmit={handleSendMessage}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        isSending={isSending}
        roomId={room.id}
      />
    </Card>
  );
};

export default ChatRoom;
