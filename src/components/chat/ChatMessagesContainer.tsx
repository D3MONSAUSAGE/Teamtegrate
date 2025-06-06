
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessageGroups from './ChatMessageGroups';
import ChatMessageLoader from './ChatMessageLoader';

interface ChatMessagesContainerProps {
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  messages: any[];
  userId?: string;
  isLoading: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  onReplyClick: (message: any) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = ({
  scrollAreaRef,
  messages,
  userId,
  isLoading,
  hasMoreMessages,
  loadMoreMessages,
  onScroll,
  onReplyClick,
  messagesEndRef
}) => {
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

  const msgMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of messages) {
      map[m.id] = m;
    }
    return map;
  }, [messages]);

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className="flex-1 p-3 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] dark:bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_f1e8c06e8d4e3296352ae4682c0632c3.png')] bg-repeat"
      onScroll={onScroll}
    >
      <ChatMessageLoader 
        isLoading={isLoading}
        hasMoreMessages={hasMoreMessages}
        loadMoreMessages={loadMoreMessages}
      />
      
      <ChatMessageGroups
        groupedMessages={groupedMessages}
        msgMap={msgMap}
        userId={userId}
        onReplyClick={onReplyClick}
      />
      
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

export default ChatMessagesContainer;
