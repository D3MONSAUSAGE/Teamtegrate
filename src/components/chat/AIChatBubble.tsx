import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AIChatWidget from './AIChatWidget';
import ChatContainer from './ChatContainer';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useChatBubble } from '@/contexts/chat/ChatBubbleContext';

const AIChatBubble: React.FC = () => {
  const { state, actions } = useChatBubble();
  const { unreadCount, markAsRead } = useUnreadMessages();

  const handleToggle = () => {
    actions.toggleBubble();
    if (!state.isOpen && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <>
      {/* Chat Widget */}
      {state.isOpen && (
        <ChatContainer>
          <AIChatWidget onClose={actions.closeBubble} />
        </ChatContainer>
      )}

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={handleToggle}
          className={cn(
            "rounded-full w-14 h-14 shadow-lg relative mobile-touch-target",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-300 ease-out touch-feedback",
            "hover:scale-110 active:scale-95",
            state.isOpen && "rotate-45"
          )}
          size="icon"
          aria-label={state.isOpen ? "Close chat" : "Open chat"}
        >
          {state.isOpen ? (
            <X className="h-6 w-6 transition-transform duration-200" />
          ) : (
            <MessageCircle className="h-6 w-6 transition-transform duration-200" />
          )}
        </Button>
        
        {/* Unread Badge */}
        {!state.isOpen && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-bounce-in"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    </>
  );
};

export default AIChatBubble;