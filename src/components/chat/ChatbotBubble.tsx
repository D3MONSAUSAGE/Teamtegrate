
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Move } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAIChat } from '@/hooks/use-ai-chat';
import { useDraggable } from '@/hooks/useDraggable';
import { useChatBubble } from '@/hooks/useChatBubble';
import ChatDragHint from './ChatDragHint';
import ChatResetButton from './ChatResetButton';
import ChatMessagesArea from './ChatMessagesArea';
import ChatInputArea from './ChatInputArea';

const ChatbotBubble = () => {
  const { messages, isProcessing, sendMessage } = useAIChat();
  const {
    isOpen,
    setIsOpen,
    message,
    setMessage,
    showDragHint,
    messagesEndRef,
    messageContainerRef,
    isChatPage,
    shouldHide,
    scrollToBottom
  } = useChatBubble();

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
  }, [messages, scrollToBottom]);

  const handleSendMessage = () => {
    if (!message.trim() || isProcessing) return;
    sendMessage(message);
    setMessage("");
  };

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
          <ChatDragHint show={showDragHint} />
          <ChatResetButton onReset={resetPosition} show={isChatPage} />

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
                
                <ChatMessagesArea
                  messages={messages}
                  isProcessing={isProcessing}
                  messagesEndRef={messagesEndRef}
                  messageContainerRef={messageContainerRef}
                />
                
                <ChatInputArea
                  message={message}
                  setMessage={setMessage}
                  onSendMessage={handleSendMessage}
                  isProcessing={isProcessing}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ChatbotBubble;
