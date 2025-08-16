import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AIChatWidget from './AIChatWidget';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const AIChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, markAsRead } = useUnreadMessages();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-20 right-2 left-2 sm:right-4 sm:left-auto z-50 w-full max-w-[calc(100vw-16px)] sm:max-w-none">
          <AIChatWidget onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={handleToggle}
          className={cn(
            "rounded-full w-14 h-14 shadow-lg relative",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-300 ease-in-out",
            isOpen && "rotate-45"
          )}
          size="icon"
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
        
        {/* Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    </>
  );
};

export default AIChatBubble;