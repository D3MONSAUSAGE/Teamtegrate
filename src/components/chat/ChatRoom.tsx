
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogOut, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChatMessageInput from './ChatMessageInput';
import ChatParticipants from './ChatParticipants';
import { useChat } from '@/hooks/use-chat';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const isMobile = useIsMobile();
  const {
    messages,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    sendMessage,
    replyTo,
    setReplyTo
  } = useChat(room.id, user?.id);

  const [leaving, setLeaving] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLeaveChat = async () => {
    if (!user) return;
    setLeaving(true);

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: room.id,
        user_id: user.id,
        content: `${user.email} has left the chat.`,
        type: 'system'
      });

    setLeaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave the chat.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Left chat",
        description: `You have left "${room.name}"`,
        variant: "default"
      });
      if (onBack) onBack();
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

  // Date grouping for messages
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
      {/* WhatsApp-style header */}
      <div className="p-2 border-b border-border dark:border-gray-800 flex items-center gap-1 bg-card dark:bg-[#1f2133] shadow-sm">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="dark:hover:bg-gray-800/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
            {room.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-base">{room.name}</h2>
            <div className="text-xs text-muted-foreground">
              <ChatParticipants roomId={room.id} compact />
            </div>
          </div>
        </div>
        
        <div className="ml-auto flex gap-2 items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleParticipants}
            className="dark:hover:bg-gray-800/50"
          >
            <Info className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options">
                <LogOut className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={handleLeaveChat}
                disabled={leaving}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right sidebar for participants */}
      {showParticipants && (
        <div className="absolute right-0 top-0 h-full w-64 bg-background dark:bg-[#1f2133] border-l border-border dark:border-gray-800 z-10 shadow-lg">
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Participants</h3>
              <Button variant="ghost" size="icon" onClick={toggleParticipants}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-2">
            <ChatParticipants roomId={room.id} />
          </div>
        </div>
      )}

      {/* Messages area with WhatsApp-like background */}
      <ScrollArea className="flex-1 p-3 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] dark:bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_f1e8c06e8d4e3296352ae4682c0632c3.png')] bg-repeat">
        <div className="space-y-4 px-1">
          {groupedMessages.map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-2">
                <div className="px-3 py-1 bg-accent/30 dark:bg-accent/10 rounded-full text-xs text-muted-foreground">
                  {date === new Date().toDateString() ? 'Today' : date}
                </div>
              </div>
              
              <div className="space-y-1">
                {dateMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={message.user_id === user?.id}
                    onReplyClick={handleReplyClick}
                    parentMessage={message.parent_id ? msgMap[message.parent_id] : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <ChatMessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        fileUploads={fileUploads}
        setFileUploads={setFileUploads}
        onSubmit={sendMessage}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
      />
    </Card>
  );
};

export default ChatRoom;
