
import React from 'react';
import { FileImage, FileText } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import ChatMessageAvatar from './ChatMessageAvatar';
import { useQuery } from '@tanstack/react-query';

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
    attachments?: Attachment[];
  };
  isCurrentUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser }) => {
  const { data: user } = useQuery({
    queryKey: ['user', message.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', message.user_id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.file_type.startsWith('image/');
    const url = `${supabase.storage.from('chat-attachments').getPublicUrl(attachment.file_path).data.publicUrl}`;

    return (
      <a
        key={attachment.id}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download={attachment.file_name}
        className="flex items-center gap-2 p-3 mt-2 bg-muted rounded hover:bg-muted/80 transition-colors"
      >
        <div className="flex-shrink-0">
          {isImage ? (
            <FileImage className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-medium truncate">{attachment.file_name}</div>
          <div className="text-xs text-muted-foreground">
            {isImage ? 'Image' : attachment.file_type.split('/')[1]?.toUpperCase() || 'File'}
          </div>
        </div>
      </a>
    );
  };

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
          {user?.name || 'Unknown User'}
        </div>
        <div
          className={`px-4 py-2.5 rounded-3xl break-words ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="mt-1 space-y-2">
          {message.attachments?.map(attachment => renderAttachment(attachment))}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
