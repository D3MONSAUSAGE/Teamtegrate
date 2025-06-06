
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
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
    isDragging,
    isLongPressing,
    wasLastInteractionDrag
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

  // Prevent drawer from opening when dragging or long pressing
  const handleDrawerOpenChange = (open: boolean) => {
    console.log('Drawer open change requested:', open, { isDragging, isLongPressing });
    
    if (isDragging || isLongPressing) {
      console.log('Preventing drawer open due to drag/long press');
      return;
    }
    
    // Check if this was a drag operation
    if (wasLastInteractionDrag()) {
      console.log('Preventing drawer open due to recent drag');
      return;
    }
    
    console.log('Allowing drawer open change to:', open);
    setIsOpen(open);
    if (open) {
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('Button clicked', { isDragging, isLongPressing });
    
    // If we're currently dragging or long pressing, prevent the click
    if (isDragging || isLongPressing) {
      console.log('Preventing button click due to drag/long press');
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Small delay to check if this was a drag operation
    setTimeout(() => {
      if (wasLastInteractionDrag()) {
        console.log('Button click was part of drag operation');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }, 50);
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

          <Drawer open={isOpen} onOpenChange={handleDrawerOpenChange}>
            {/* Main chat button - draggable and opens drawer */}
            <DrawerTrigger asChild>
              <Button 
                size="icon" 
                className={`h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:scale-105 active:scale-95 select-none ${
                  isLongPressing ? 'scale-95 opacity-80' : ''
                } ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onClick={handleButtonClick}
                style={{ 
                  touchAction: 'none'
                }}
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MessageCircle className="h-6 w-6" />
                )}
              </Button>
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
