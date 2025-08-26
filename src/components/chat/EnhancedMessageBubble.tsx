
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
      "flex gap-2 mb-3 group",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <Avatar className="w-8 h-8 border border-border">
          <AvatarImage src={userAvatar} />
          <AvatarFallback className={cn(
            "text-xs font-medium",
            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[70%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        {/* User name for non-current users */}
        {!isCurrentUser && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-2">
            {userName}
          </span>
        )}

        {/* Message bubble */}
        <div className={cn(
          "px-3 py-2 rounded-lg text-sm",
          isCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}>
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Message timestamp */}
          {showTimestamp && (
            <div className={cn(
              "text-xs mt-1 opacity-70",
              isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatTime(message.created_at)}
              {message.updated_at !== message.created_at && (
                <span className="ml-1">(edited)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageBubble;
