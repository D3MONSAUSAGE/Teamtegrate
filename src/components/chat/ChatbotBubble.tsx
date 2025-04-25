
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
import { useIsMobile } from '@/hooks/use-mobile';

const ChatbotBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { messages, isProcessing, sendMessage } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isMobile) {
      // For mobile devices, detect keyboard visibility by tracking focus on input
      const checkKeyboard = () => {
        setIsKeyboardVisible(document.activeElement?.tagName === 'TEXTAREA');
      };

      document.addEventListener('focusin', checkKeyboard);
      document.addEventListener('focusout', () => setIsKeyboardVisible(false));

      return () => {
        document.removeEventListener('focusin', checkKeyboard);
        document.removeEventListener('focusout', () => setIsKeyboardVisible(false));
      };
    }
  }, [isMobile]);

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
      <Sheet open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          // Small delay to ensure the sheet is visible before scrolling
          setTimeout(scrollToBottom, 100);
        }
      }}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className={`w-[90vw] sm:w-[440px] p-0 flex flex-col h-[100vh] inset-y-0 rounded-l-xl shadow-2xl border-l border-border ${isKeyboardVisible && isMobile ? 'pb-0' : ''}`}
          style={{
            // Improve mobile handling with viewport units
            height: isKeyboardVisible && isMobile ? '-webkit-fill-available' : '100vh',
            maxHeight: isKeyboardVisible && isMobile ? '-webkit-fill-available' : '100vh'
          }}
        >
          <SheetHeader className="p-4 border-b bg-secondary/30">
            <SheetTitle className="text-foreground">AI Assistant</SheetTitle>
          </SheetHeader>
          
          <div 
            ref={messageContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-4 bg-background ${isKeyboardVisible && isMobile ? 'pb-1' : ''}`}
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
          
          <div className={`p-4 border-t bg-secondary/20 ${isKeyboardVisible && isMobile ? 'pt-2 pb-2' : ''}`}>
            <div className="flex gap-2 items-center">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => isMobile && setTimeout(scrollToBottom, 300)}
                placeholder="Type your message..."
                className="min-h-[60px] max-h-[120px] resize-none rounded-xl px-4 py-2 border border-border bg-background focus:ring-2 focus:ring-primary"
                disabled={isProcessing}
                style={{ 
                  minHeight: isKeyboardVisible && isMobile ? '50px' : '60px',
                  maxHeight: isKeyboardVisible && isMobile ? '80px' : '120px'
                }}
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={!message.trim() || isProcessing}
                className="rounded-xl h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ChatbotBubble;
