import React from 'react';
import { FileImage, FileText, Download } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import ChatMessageAvatar from './ChatMessageAvatar';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
    attachments?: Attachment[];
  };
  isCurrentUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser }) => {
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

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.file_type.startsWith('image/');
    const url = supabase.storage.from('chat-attachments').getPublicUrl(attachment.file_path).data.publicUrl;

    return (
      <div
        key={attachment.id}
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[rgba(147,39,143,0.08)] to-[rgba(234,172,232,0.16)] shadow-sm border border-accent/30 mb-1 hover:shadow-md transition hover:scale-[1.02] group max-w-full"
        style={{ minWidth: 0 }}
      >
        <div
          className={`flex-shrink-0 rounded-lg w-10 h-10 flex items-center justify-center bg-gradient-to-tr ${
            isImage
              ? 'from-purple-400 to-pink-300'
              : 'from-blue-400 to-blue-300'
          } shadow group-hover:ring-2 group-hover:ring-primary/40 transition`}
        >
          {isImage ? <FileImage className="h-6 w-6 text-white" /> : <FileText className="h-6 w-6 text-white" />}
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
              className="ml-2 group/download rounded-full hover:bg-accent hover:text-primary transition-colors p-1"
              title="Download file"
            >
              <Download className="h-5 w-5 text-primary group-hover:text-purple-800 transition" />
            </a>
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">
            {isImage ? 'Image' : (attachment.file_type.split('/')[1]?.toUpperCase() || 'File')}
          </div>
          {isImage && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-lg overflow-hidden border border-muted/50 hover:shadow-lg transition-all" title="Preview image">
              <img
                src={url}
                alt={attachment.file_name}
                className="w-32 max-h-36 object-cover transition-transform group-hover:scale-105"
                style={{ background: "#f6f1fb" }}
              />
            </a>
          )}
        </div>
      </div>
    );
  };

  const displayName = message.type === 'system' ? 'System' : userData?.name || (isCurrentUser ? 'You' : 'Unknown User');

  return (
    <div
      className={`flex items-start gap-3 ${
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <ChatMessageAvatar 
        userId={message.user_id}
        className="mt-0.5 flex-shrink-0 w-8 h-8"
      />
      <div
        className={`group relative max-w-[85%] sm:max-w-[75%] ${
          isCurrentUser ? 'items-end' : 'items-start'
        }`}
      >
        <div className={`text-xs text-muted-foreground mb-1 ${
          isCurrentUser ? 'text-right' : 'text-left'
        }`}>
          {displayName}
        </div>
        <div
          className={`px-4 py-2.5 rounded-3xl break-words ${
            isCurrentUser
              ? 'bg-gradient-to-tr from-primary to-purple-400 text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="mt-2 space-y-1">
          {message.attachments?.map(attachment => renderAttachment(attachment))}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
