
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import MessageReactions from './MessageReactions';
import { MessageStatus } from './MessageStatus';
import ChatMessageAttachment from './ChatMessageAttachment';

interface EnhancedMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  userName?: string;
  userAvatar?: string;
  onRetryMessage?: (messageId: string) => void;
}

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar = true,
  showTimestamp = true,
  userName = 'Unknown User',
  userAvatar,
  onRetryMessage
}) => {
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
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

        {/* Message bubble and reactions container */}
        <div className={cn(
          "flex flex-col",
          isCurrentUser ? "items-end" : "items-start"
        )}>
          {/* Message bubble */}
          <div className={cn(
            "px-3 py-2 rounded-lg text-sm",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}>
            {/* Text content */}
            {message.content && (
              <p className="leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            
            {/* File attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={cn("space-y-2", message.content ? "mt-2" : "")}>
                {message.attachments.map((attachment) => (
                  <ChatMessageAttachment
                    key={attachment.id}
                    attachment={{
                      id: attachment.id,
                      file_name: attachment.file_name,
                      file_type: attachment.file_type,
                      file_path: attachment.file_url
                    }}
                    allImages={message.attachments?.filter(att => 
                      att.file_type.startsWith('image/')
                    ).map(att => ({
                      id: att.id,
                      file_name: att.file_name,
                      file_type: att.file_type,
                      file_path: att.file_url
                    }))}
                  />
                ))}
              </div>
            )}

            {/* Message timestamp */}
            {showTimestamp && (
              <div className={cn(
                "text-xs mt-1 opacity-70 flex items-center gap-2",
                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                <span>
                  {formatTime(message.created_at)}
                </span>
                {message.updated_at !== message.created_at && (
                  <span className="italic">(edited)</span>
                )}
                {isCurrentUser && (
                  <MessageStatus 
                    status={message.status} 
                    onRetry={message.status === 'failed' ? () => onRetryMessage?.(message.id) : undefined}
                  />
                )}
              </div>
            )}
          </div>

          {/* Message reactions */}
          <MessageReactions messageId={message.id} />
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageBubble;
