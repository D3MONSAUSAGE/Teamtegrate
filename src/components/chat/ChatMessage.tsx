
import React from 'react';
import { FileImage, FileText } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import ChatMessageAvatar from './ChatMessageAvatar';

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
  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.file_type.startsWith('image/');
    const url = `${supabase.storage.from('chat-attachments').getPublicUrl(attachment.file_path).data.publicUrl}`;

    return (
      <a
        key={attachment.id}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-2 mt-2 bg-muted rounded hover:bg-muted/80 transition-colors"
      >
        {isImage ? (
          <FileImage className="inline-block mr-2 h-4 w-4" />
        ) : (
          <FileText className="inline-block mr-2 h-4 w-4" />
        )}
        {attachment.file_name}
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
        <div
          className={`px-4 py-2.5 rounded-3xl break-words ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        {message.attachments?.map(attachment => renderAttachment(attachment))}
      </div>
    </div>
  );
};

export default ChatMessage;
