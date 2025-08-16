import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatMessageProps {
  message: Message;
}

const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        <div className={cn(
          "inline-block max-w-[75%] sm:max-w-[85%] px-2 sm:px-3 py-2 rounded-lg text-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted text-foreground rounded-bl-sm"
        )}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground mt-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default AIChatMessage;