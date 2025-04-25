
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAIChat } from '@/hooks/use-ai-chat';

const ChatbotBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { messages, isProcessing, sendMessage } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim() || isProcessing) return;
    sendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if the last message contains an error about quota
  const hasQuotaError = messages.length > 0 && 
    messages[messages.length - 1].sender === 'assistant' && 
    messages[messages.length - 1].content.includes('quota');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[90vw] sm:w-[440px] p-0 flex flex-col h-[85vh] max-h-[85vh]">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Chat Assistant</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 h-full">
            {messages.length === 0 ? (
              <div className="text-muted-foreground text-center">
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
          <div className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isProcessing}
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={!message.trim() || isProcessing}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ChatbotBubble;
