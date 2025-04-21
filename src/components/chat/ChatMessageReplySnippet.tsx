
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessageReplySnippetProps {
  parentMessage: {
    content?: string;
    user_id?: string;
  } | undefined;
}

const ChatMessageReplySnippet: React.FC<ChatMessageReplySnippetProps> = ({ parentMessage }) => {
  const { user: currentUser } = useAuth();

  // Return null if there's no parent message or if it doesn't have content
  if (!parentMessage || !parentMessage.content) return null;

  return (
    <div className="mb-1 pl-2 py-1 border-l-2 border-primary/50 bg-accent/15 rounded text-xs text-muted-foreground max-w-full">
      <span className="font-semibold">
        {parentMessage.user_id === currentUser?.id ? "You" : "Replied"}:
      </span>{" "}
      <span className="italic truncate">
        {parentMessage.content.slice(0, 60)}
        {parentMessage.content.length > 60 ? "..." : ""}
      </span>
    </div>
  );
};

export default ChatMessageReplySnippet;
