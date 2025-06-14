
import React from 'react';
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      'flex w-full',
      isCurrentUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[70%] rounded-lg px-3 py-2 text-sm',
        isCurrentUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      )}>
        {message.message_type === 'system' && (
          <div className="text-xs text-muted-foreground mb-1 italic">
            System message
          </div>
        )}
        
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        <div className={cn(
          'text-xs mt-1 opacity-70',
          isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatTime(message.created_at)}
          {message.updated_at !== message.created_at && (
            <span className="ml-1">(edited)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
