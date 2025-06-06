
import React from 'react';
import { AlertTriangle } from "lucide-react";

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesAreaProps {
  messages: Message[];
  isProcessing: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messageContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatMessagesArea: React.FC<ChatMessagesAreaProps> = ({
  messages,
  isProcessing,
  messagesEndRef,
  messageContainerRef
}) => {
  const hasQuotaError = messages.length > 0 && 
    messages[messages.length - 1].sender === 'assistant' && 
    messages[messages.length - 1].content.includes('quota');

  return (
    <div 
      ref={messageContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
      style={{ maxHeight: "calc(85vh - 60px - 80px)" }}
    >
      {messages.length === 0 ? (
        <div className="text-muted-foreground text-center mt-8 py-8">
          How can I help you today?
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`rounded-lg p-3 max-w-[80%] ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground self-end'
                  : 'bg-muted self-start'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isProcessing && (
            <div className="bg-muted self-start rounded-lg p-3 max-w-[80%]">
              <div className="flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
              </div>
            </div>
          )}
          {hasQuotaError && (
            <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">OpenAI API Quota Exceeded</p>
                <p className="mt-1">The administrator needs to check the OpenAI account billing status or upgrade the plan.</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatMessagesArea;
