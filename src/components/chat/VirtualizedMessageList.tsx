import React, { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { ChatMessage } from '@/types/chat';
import EnhancedMessageBubble from './EnhancedMessageBubble';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  height: number;
  width: number;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: ChatMessage[];
    currentUserId?: string;
  };
}

const MessageItem: React.FC<MessageItemProps> = ({ index, style, data }) => {
  const { messages, currentUserId } = data;
  const message = messages[index];
  const prevMessage = messages[index - 1];
  
  if (!message?.id || !message?.content) return null;

  const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id;

  return (
    <div style={style}>
      <div className="px-6 py-1">
        <EnhancedMessageBubble
          message={message}
          isCurrentUser={message.user_id === currentUserId}
          showAvatar={showAvatar}
          userName={message.user_id === currentUserId ? 'You' : 'User'}
        />
      </div>
    </div>
  );
};

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  currentUserId,
  height,
  width
}) => {
  const itemData = useMemo(() => ({
    messages,
    currentUserId
  }), [messages, currentUserId]);

  // Estimate item height based on message content
  const getItemSize = (index: number) => {
    const message = messages[index];
    if (!message) return 60;
    
    // Base height + estimated height based on content length
    const baseHeight = 60;
    const contentLines = Math.ceil(message.content.length / 50);
    return baseHeight + (contentLines - 1) * 20;
  };

  if (messages.length === 0) return null;

  return (
    <List
      height={height}
      width={width}
      itemCount={messages.length}
      itemSize={getItemSize}
      itemData={itemData}
      overscanCount={5}
    >
      {MessageItem}
    </List>
  );
};