
import React from 'react';

interface ChatMessageReplySnippetProps {
  parentMessage: {
    content: string;
    user_id: string;
  };
}

const ChatMessageReplySnippet: React.FC<ChatMessageReplySnippetProps> = ({ parentMessage }) => {
  return (
    <div className="bg-muted/50 border-l-2 border-primary/50 pl-3 py-1 mb-2">
      <p className="text-xs text-muted-foreground truncate">
        Replying to: {parentMessage.content.substring(0, 50)}...
      </p>
    </div>
  );
};

export default ChatMessageReplySnippet;
