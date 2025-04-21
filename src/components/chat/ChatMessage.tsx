
import React from 'react';
import { FileImage, FileText, Download, MessageSquareReply, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import ChatMessageAvatar from './ChatMessageAvatar';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import MessageReactions from './MessageReactions';
import { formatDistanceToNow } from 'date-fns';

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
  const { user: currentUser } = useAuth();
  
  const { data: userData } = useQuery({
    queryKey: ['user', message.user_id],
    queryFn: async () => {
      if (message.type === 'system') {
        return { name: 'System' };
      }
      
      if (isCurrentUser && currentUser) {
        return { name: currentUser.name };
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', message.user_id)
        .single();
      
      if (error || !data) {
        console.warn('Failed to fetch user details:', error);
        return { name: isCurrentUser ? 'You' : 'Unknown User' };
      }
      
      return data;
    },
    initialData: isCurrentUser && currentUser 
      ? { name: currentUser.name } 
      : message.type === 'system' 
        ? { name: 'System' } 
        : { name: 'Unknown User' }
  });

  // Format timestamp if available
  const timestamp = message.created_at 
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: false })
    : '';

  let replySnippet = null;
  if (parentMessage) {
    replySnippet = (
      <div className="mb-1 pl-2 py-1 border-l-2 border-primary/50 bg-accent/15 rounded text-xs text-muted-foreground max-w-full">
        <span className="font-semibold">
          {parentMessage.user_id === currentUser?.id ? "You" : "Replied"}:
        </span>{" "}
        <span className="italic truncate">{parentMessage.content?.slice(0, 60)}{parentMessage.content?.length > 60 ? '...' : ''}</span>
      </div>
    );
  }

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.file_type.startsWith('image/');
    const url = supabase.storage.from('chat-attachments').getPublicUrl(attachment.file_path).data.publicUrl;

    return (
      <div
        key={attachment.id}
        className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 shadow-sm border border-accent/20 mb-1 hover:shadow-md transition hover:scale-[1.02] group max-w-full"
        style={{ minWidth: 0 }}
      >
        <div
          className={`flex-shrink-0 rounded-lg w-10 h-10 flex items-center justify-center bg-gradient-to-tr ${
            isImage
              ? 'from-primary/80 to-primary/60'
              : 'from-accent/80 to-accent/60'
          } shadow`}
        >
          {isImage ? <FileImage className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <div className="truncate font-medium text-sm text-gray-900 dark:text-white">
              {attachment.file_name}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.file_name}
              className="ml-2 rounded-full hover:bg-accent hover:text-primary transition-colors p-1"
              title="Download file"
            >
              <Download className="h-4 w-4 text-primary" />
            </a>
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">
            {isImage ? 'Image' : (attachment.file_type.split('/')[1]?.toUpperCase() || 'File')}
          </div>
          {isImage && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-lg overflow-hidden border border-muted/30 hover:shadow-lg transition-all" title="Preview image">
              <img
                src={url}
                alt={attachment.file_name}
                className="w-48 max-h-36 object-cover transition-transform group-hover:scale-105"
                style={{ background: "#f6f1fb" }}
              />
            </a>
          )}
        </div>
      </div>
    );
  };

  const displayName = message.type === 'system' ? 'System' : userData?.name || (isCurrentUser ? 'You' : 'Unknown User');
  
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
            {replySnippet}
            
            <div className={messageBubbleClasses}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center justify-end gap-1 mt-1 text-right">
                <span className="text-[10px] text-muted-foreground/70 dark:text-muted-foreground/60">
                  {timestamp ? timestamp : <Clock className="inline w-3 h-3 opacity-70" />}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              {message.attachments?.map(attachment => renderAttachment(attachment))}
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
