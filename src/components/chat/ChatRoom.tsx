
import React, { useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChatMessageInput from './ChatMessageInput';
import { useChat } from '@/hooks/use-chat';

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
    sendMessage
  } = useChat(room.id, user?.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Card className="flex flex-col h-full border-none shadow-none bg-background">
      <div className="p-4 border-b flex items-center gap-2 bg-card">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="font-semibold">{room.name}</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.user_id === user?.id}
            />
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
      />
    </Card>
  );
};

export default ChatRoom;
