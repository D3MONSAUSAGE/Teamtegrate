
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  userName?: string;
  userAvatar?: string;
}

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar = true,
  showTimestamp = true,
  userName = 'Unknown User',
  userAvatar
}) => {
  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <Badge 
          variant="outline" 
          className="px-4 py-2 bg-muted/30 text-muted-foreground border-muted/50 text-xs"
        >
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-3 mb-4 group animate-fade-in",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <Avatar className="w-10 h-10 border-2 border-background shadow-md">
          <AvatarImage src={userAvatar} />
          <AvatarFallback className={cn(
            "text-xs font-semibold",
            isCurrentUser 
              ? "bg-gradient-to-br from-primary to-purple-500 text-white"
              : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
          )}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[70%] sm:max-w-[60%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        {/* User name for non-current users */}
        {!isCurrentUser && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
            {userName}
          </span>
        )}

        {/* Message bubble */}
        <div className={cn(
          "relative px-4 py-3 rounded-2xl shadow-sm border transition-all duration-200 group-hover:shadow-md",
          isCurrentUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md border-primary/20"
            : "bg-card/90 border-border/50 rounded-bl-md hover:bg-card"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Message timestamp */}
          {showTimestamp && (
            <div className={cn(
              "text-xs mt-2 opacity-0 group-hover:opacity-70 transition-opacity duration-200",
              isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatTime(message.created_at)}
              {message.updated_at !== message.created_at && (
                <span className="ml-1">(edited)</span>
              )}
            </div>
          )}

          {/* Message status indicators */}
          {isCurrentUser && (
            <div className="absolute -bottom-1 -right-1">
              <div className="w-4 h-4 bg-background rounded-full border-2 border-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageBubble;
