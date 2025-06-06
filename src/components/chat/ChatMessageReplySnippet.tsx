
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Reply } from "lucide-react";

interface ChatMessageReplySnippetProps {
  parentMessage: {
    content?: string;
    user_id?: string;
  } | undefined;
}

const ChatMessageReplySnippet: React.FC<ChatMessageReplySnippetProps> = ({ parentMessage }) => {
  const { user: currentUser } = useAuth();

  if (!parentMessage || !parentMessage.content) return null;

  return (
    <div className="mb-2 p-2 border-l-3 border-primary/60 bg-accent/10 dark:bg-accent/5 rounded-r-lg text-xs max-w-full">
      <div className="flex items-center gap-1 mb-1">
        <Reply className="w-3 h-3 text-primary/70" />
        <span className="font-semibold text-primary">
          {parentMessage.user_id === currentUser?.id ? "You" : "Replied to"}
        </span>
      </div>
      <span className="text-muted-foreground italic block truncate">
        {parentMessage.content.slice(0, 80)}
        {parentMessage.content.length > 80 ? "..." : ""}
      </span>
    </div>
  );
};

export default ChatMessageReplySnippet;
