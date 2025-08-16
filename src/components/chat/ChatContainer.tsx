import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useChatBubble } from '@/contexts/chat/ChatBubbleContext';

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ children, className }) => {
  const { state } = useChatBubble();
  
  // Container dimensions based on state
  const containerStyles = {
    compact: {
      ai: 'w-[min(380px,calc(100vw-2rem))] h-[min(480px,calc(100vh-8rem))]',
      team: 'w-[min(400px,calc(100vw-2rem))] h-[min(600px,calc(100vh-8rem))]'
    },
    expanded: {
      ai: 'w-[min(420px,calc(100vw-2rem))] h-[min(520px,calc(100vh-6rem))]',
      team: 'w-[min(450px,calc(100vw-2rem))] h-[min(650px,calc(100vh-6rem))]'
    }
  };

  // Position styles
  const positionStyles = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  const currentSize = containerStyles[state.size][state.activeTab];
  const currentPosition = positionStyles[state.position];

  return (
    <div 
      className={cn(
        'fixed z-50',
        currentPosition,
        'mobile-optimized',
        className
      )}
    >
      <Card 
        className={cn(
          'shadow-2xl border-border/20 backdrop-blur-xl',
          'bg-card/95 animate-scale-in',
          'transition-all duration-300 ease-out',
          currentSize,
          // Mobile-specific optimizations
          'max-w-[calc(100vw-1rem)] max-h-[calc(100vh-6rem)]',
          // Ensure proper stacking
          'relative overflow-hidden'
        )}
      >
        {children}
      </Card>
    </div>
  );
};

export default ChatContainer;