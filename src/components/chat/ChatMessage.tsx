
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
  const { data: userData } = useMessageDisplayName(message, isCurrentUser);

  const timestamp = message.created_at 
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: false })
    : '';

  const displayName = message.type === 'system' ? 'System' : userData?.name || (isCurrentUser ? 'You' : 'Unknown User');
  
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1 bg-accent/30 dark:bg-accent/20 rounded-full text-xs text-muted-foreground max-w-xs text-center">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col mb-3 relative group">
      {!isCurrentUser && (
        <div className="text-xs text-muted-foreground ml-12 mb-1 font-medium">
          {displayName}
        </div>
      )}
      
      <div className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        {!isCurrentUser && (
          <ChatMessageAvatar 
            userId={message.user_id}
            className="mb-0.5 flex-shrink-0 w-8 h-8"
          />
        )}
        
        <div className={`max-w-[85%] sm:max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          <div className="space-y-1">
            {parentMessage && (
              <ChatMessageReplySnippet parentMessage={parentMessage} />
            )}
            
            <div className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground rounded-br-md ml-auto'
                : 'bg-card dark:bg-[#2a2f45] border border-border dark:border-gray-700 rounded-bl-md'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className={`text-[10px] ${
                  isCurrentUser 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground/70'
                }`}>
                  {timestamp || <Clock className="inline w-3 h-3 opacity-70" />}
                </span>
              </div>
            </div>
            
            {message.attachments?.map(attachment => (
              <ChatMessageAttachment key={attachment.id} attachment={attachment} />
            ))}
            
            <div className={`flex mt-1 ${isCurrentUser ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
              <MessageReactions messageId={message.id} />
            </div>
          </div>
          
          {onReplyClick && (
            <button
              title="Reply"
              className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-full transition-all bg-background hover:bg-accent border border-border shadow-sm absolute ${
                isCurrentUser ? '-left-8 bottom-4' : '-right-8 bottom-4'
              }`}
              onClick={() => onReplyClick(message)}
              type="button"
            >
              <MessageSquareReply className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
        
        {isCurrentUser && (
          <ChatMessageAvatar 
            userId={message.user_id}
            className="mb-0.5 flex-shrink-0 w-8 h-8"
          />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
