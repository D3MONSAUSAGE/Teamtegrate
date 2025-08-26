import React from 'react';
import { cn } from '@/lib/utils';

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

const TypingDots: React.FC = () => (
  <div className="flex space-x-1 items-center">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
    </div>
  </div>
);

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className = ''
}) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers[2].name} are typing`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground bg-muted/30 border-t border-border/50",
      "animate-in slide-in-from-bottom-2 duration-200",
      className
    )}>
      <TypingDots />
      <span className="italic">{getTypingText()}...</span>
    </div>
  );
};