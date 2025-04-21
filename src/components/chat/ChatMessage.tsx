import React from 'react';
import { MessageSquareReply, Clock } from 'lucide-react';
import ChatMessageAvatar from './ChatMessageAvatar';
import MessageReactions from './MessageReactions';
import { formatDistanceToNow } from 'date-fns';
import ChatMessageAttachment from './ChatMessageAttachment';
import ChatMessageReplySnippet from './ChatMessageReplySnippet';
import { useMessageDisplayName } from './hooks/useMessageDisplayName';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
}

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    user_id: string;
    type?: 'text' | 'system';
    parent_id?: string | null;
    attachments?: Attachment[];
    created_at?: string;
  };
  isCurrentUser: boolean;
  onReplyClick?: (msg: any) => void;
  parentMessage?: {
    content: string;
    user_id: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  onReplyClick,
  parentMessage,
}) => {
  // Replace user fetching logic with hook
  const { data: userData } = useMessageDisplayName(message, isCurrentUser);

  // Format timestamp if available
  const timestamp = message.created_at 
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: false })
    : '';

  // Use the refactored reply snippet component
  const replySnippet = (
    <ChatMessageReplySnippet parentMessage={parentMessage} />
  );

  // WhatsApp-style class definitions
  const messageContainerClasses = `max-w-[85%] sm:max-w-[70%] ${
    isCurrentUser 
      ? 'ml-auto items-end' 
      : 'mr-auto items-start'
  }`;
  
  const messageBubbleClasses = `px-3 py-2 rounded-lg break-words relative ${
    isCurrentUser
      ? 'bg-primary/90 text-primary-foreground rounded-tr-none'
      : 'bg-muted dark:bg-[#262d45] dark:text-white rounded-tl-none'
  }`;

  const displayName = message.type === 'system' ? 'System' : userData?.name || (isCurrentUser ? 'You' : 'Unknown User');
  
  return (
    <div className="flex flex-col mb-1 relative group">
      {/* Show user name only for non-current users and not showing continuously from same user */}
      {!isCurrentUser && (
        <div className="text-xs text-muted-foreground ml-12 mb-0.5">
          {displayName}
        </div>
      )}
      
      <div className="flex items-end gap-1">
        {!isCurrentUser && (
          <ChatMessageAvatar 
            userId={message.user_id}
            className="mb-0.5 flex-shrink-0 w-8 h-8"
          />
        )}
        
        <div className={messageContainerClasses}>
          <div className="space-y-0.5">
            {/* Use extracted reply snippet */}
            {parentMessage ? replySnippet : null}
            
            <div className={messageBubbleClasses}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center justify-end gap-1 mt-1 text-right">
                <span className="text-[10px] text-muted-foreground/70 dark:text-muted-foreground/60">
                  {timestamp ? timestamp : <Clock className="inline w-3 h-3 opacity-70" />}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              {/* Use extracted attachment rendering */}
              {message.attachments?.map(attachment => (
                <ChatMessageAttachment key={attachment.id} attachment={attachment} />
              ))}
            </div>
            
            <div className="flex justify-end mt-0.5 pr-1">
              <MessageReactions messageId={message.id} />
            </div>
          </div>
          
          {onReplyClick && (
            <button
              title="Reply"
              className={`opacity-0 group-hover:opacity-100 p-1 rounded-full transition bg-background hover:bg-accent border border-border absolute ${
                isCurrentUser ? '-left-6 bottom-2' : '-right-6 bottom-2'
              }`}
              onClick={() => onReplyClick(message)}
              type="button"
            >
              <MessageSquareReply className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
