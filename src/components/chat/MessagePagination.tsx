import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronUp } from 'lucide-react';

interface MessagePaginationProps {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  messagesCount: number;
}

export const MessagePagination: React.FC<MessagePaginationProps> = ({
  hasMore,
  loadingMore,
  onLoadMore,
  messagesCount
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessagesCount = useRef(messagesCount);

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (prevMessagesCount.current !== messagesCount && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea && messagesCount > prevMessagesCount.current) {
        // New messages were added, maintain relative scroll position
        const scrollHeight = scrollArea.scrollHeight;
        const currentScroll = scrollArea.scrollTop;
        const prevScrollHeight = scrollHeight - (messagesCount - prevMessagesCount.current) * 60; // Estimate message height
        
        if (currentScroll < 100) {
          // User was near top, keep them there after loading more
          scrollArea.scrollTop = scrollHeight - prevScrollHeight + currentScroll;
        }
      }
    }
    prevMessagesCount.current = messagesCount;
  }, [messagesCount]);

  if (!hasMore && messagesCount === 0) {
    return null;
  }

  return (
    <div className="flex justify-center py-4 border-b border-border/50">
      {hasMore ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          {loadingMore ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading older messages...
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4" />
              Load older messages
            </>
          )}
        </Button>
      ) : messagesCount > 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          This is the beginning of your conversation
        </div>
      ) : null}
    </div>
  );
};
