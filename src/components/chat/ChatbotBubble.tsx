
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, AlertTriangle, Move, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAIChat } from '@/hooks/use-ai-chat';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDraggable } from '@/hooks/useDraggable';
import { useLocation } from 'react-router-dom';

const ChatbotBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { messages, isProcessing, sendMessage } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);

  const isChatPage = location.pathname.includes('/chat');

  // Use draggable hook with smart positioning
  const {
    position,
    elementRef,
    onMouseDown,
    onTouchStart,
    resetPosition,
  } = useDraggable({
    defaultPosition: { x: window.innerWidth - 80, y: window.innerHeight - 80 },
    storageKey: 'chatbot-position',
    boundaries: {
      top: 20,
      left: 20,
      right: window.innerWidth - 80,
      bottom: window.innerHeight - 80
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isMobile) {
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

  useEffect(() => {
    if (isChatPage && !localStorage.getItem('chatbot-drag-hint-shown')) {
      setShowDragHint(true);
      const timer = setTimeout(() => {
        setShowDragHint(false);
        localStorage.setItem('chatbot-drag-hint-shown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isChatPage]);

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

  const hasQuotaError = messages.length > 0 && 
    messages[messages.length - 1].sender === 'assistant' && 
    messages[messages.length - 1].content.includes('quota');

  const shouldHide = isMobile && isKeyboardVisible && isChatPage;

  return (
    <div 
      ref={elementRef}
      className={`fixed z-50 transition-all duration-300 ease-out ${shouldHide ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
      style={{
        left: 0,
        top: 0,
        willChange: 'transform',
      }}
    >
      <TooltipProvider>
        <div className="relative">
          {showDragHint && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap animate-bounce z-10">
              Drag me to move!
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
              </div>
            </div>
          )}

          {isChatPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -top-8 -left-8 h-6 w-6 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background transition-colors"
                  onClick={resetPosition}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset position</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Drawer open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
              setTimeout(scrollToBottom, 100);
            }
          }}>
            <DrawerTrigger asChild>
              <div className="relative">
                <Button 
                  size="icon" 
                  className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={onMouseDown}
                  onTouchStart={onTouchStart}
                >
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <MessageCircle className="h-6 w-6" />
                  )}
                </Button>
                
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-muted rounded-full flex items-center justify-center pointer-events-none">
                  <Move className="h-2 w-2 text-muted-foreground" />
                </div>
              </div>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] flex flex-col">
              <div className="flex flex-col h-full max-h-[85vh]">
                <DrawerHeader className="p-4 border-b bg-secondary/30">
                  <DrawerTitle className="text-foreground">AI Assistant</DrawerTitle>
                </DrawerHeader>
                
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
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isProcessing}
                      className="rounded-xl h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ChatbotBubble;
