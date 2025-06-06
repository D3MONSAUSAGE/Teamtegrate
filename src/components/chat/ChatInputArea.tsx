
import React from 'react';
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputAreaProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  isProcessing: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  message,
  setMessage,
  onSendMessage,
  isProcessing
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-4 border-t bg-secondary/20">
      <div className="flex gap-2 items-center">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[60px] max-h-[120px] resize-none rounded-xl px-4 py-2 border border-border bg-background focus:ring-2 focus:ring-primary"
          disabled={isProcessing}
        />
        <Button 
          size="icon"
          onClick={onSendMessage}
          disabled={!message.trim() || isProcessing}
          className="rounded-xl h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInputArea;
