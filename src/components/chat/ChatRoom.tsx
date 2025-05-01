
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
import ChatParticipantsSidebar from './ChatParticipantsSidebar';
import ChatMessageGroups from './ChatMessageGroups';
import AddChatParticipantDialog from './AddChatParticipantDialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { playSuccessSound } from '@/utils/sounds';

interface ChatRoomProps {
  room: {
    id: string;
    name: string;
  };
  onBack?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, onBack }) => {
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    
    // If user scrolls to top, load more messages
    if (scrollTop < 50 && hasMoreMessages) {
      loadMoreMessages();
    }
    
    // Detect if we're near bottom to enable auto-scroll
    const { scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setAutoScrollEnabled(isNearBottom);
  };

  useEffect(() => {
    // Only auto-scroll on new messages if auto-scroll is enabled or if it's the initial render
    if (messages.length > 0 && (autoScrollEnabled || !initialScrollDone)) {
      scrollToBottom();
      setInitialScrollDone(true);
    }
  }, [messages, autoScrollEnabled, initialScrollDone]);

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
  
  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
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

  const handleParticipantAdded = () => {
    playSuccessSound();
    toast.success('Member added to the chat room');
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    let typingText = '';
    if (typingUsers.length === 1) {
      typingText = `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      typingText = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      typingText = `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
    }
    
    return (
      <div className="px-4 py-1 text-xs text-muted-foreground italic">
        {typingText}
        <span className="typing-animation">
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </span>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full border-border dark:border-gray-800 shadow-none bg-background dark:bg-[#111827] overflow-hidden">
      <ChatRoomHeader
        room={room}
        isMobile={isMobile}
        onBack={onBack}
        toggleParticipants={toggleParticipants}
        onLeave={handleLeaveChat}
        leaving={leaving}
      />

      <div className="absolute right-3 top-5 z-20 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowAddParticipant(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Add Member
        </Button>
      </div>
      {showAddParticipant && (
        <AddChatParticipantDialog
          open={showAddParticipant}
          onOpenChange={setShowAddParticipant}
          roomId={room.id}
          onAdded={handleParticipantAdded}
        />
      )}

      {showParticipants && (
        <ChatParticipantsSidebar
          roomId={room.id}
          onClose={toggleParticipants}
        />
      )}

      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-3 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] dark:bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_f1e8c06e8d4e3296352ae4682c0632c3.png')] bg-repeat"
        onScroll={handleScroll}
      >
        {isLoading && (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {hasMoreMessages && !isLoading && (
          <div className="flex justify-center my-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              onClick={loadMoreMessages}
            >
              Load earlier messages
            </Button>
          </div>
        )}
        
        <ChatMessageGroups
          groupedMessages={groupedMessages}
          msgMap={msgMap}
          userId={user?.id}
          onReplyClick={handleReplyClick}
        />
        
        <div ref={messagesEndRef} />
      </ScrollArea>

      {renderTypingIndicator()}

      <ChatMessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        fileUploads={fileUploads}
        setFileUploads={setFileUploads}
        onSubmit={sendMessage}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        isSending={isSending}
      />
      
      <style jsx global>{`
        .typing-animation .dot {
          animation: typing 1.5s infinite;
          display: inline-block;
          opacity: 0;
        }
        
        .typing-animation .dot:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing-animation .dot:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .typing-animation .dot:nth-child(3) {
          animation-delay: 1s;
        }
        
        @keyframes typing {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </Card>
  );
};

export default ChatRoom;
