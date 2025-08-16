import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import ChatMessageAvatar from './ChatMessageAvatar';
import { cn } from '@/lib/utils';

interface CompactMessageAreaProps {
  roomId: string | null;
}

const CompactMessageArea: React.FC<CompactMessageAreaProps> = ({ roomId }) => {
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage, error } = useMessages(roomId);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Debug logging
  console.log('CompactMessageArea render:', { 
    roomId, 
    loading, 
    error, 
    messageCount: messages.length,
    user: !!user,
    userDetails: user ? { id: user.id, name: user.name, email: user.email } : null
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !roomId) return;

    const messageText = input.trim();
    setInput('');
    setIsSending(true);
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const groupMessages = (messages: any[]) => {
    const grouped = [];
    let currentGroup = null;

    for (const message of messages) {
      if (
        currentGroup &&
        currentGroup.userId === message.user_id &&
        new Date(message.created_at).getTime() - 
        new Date(currentGroup.messages[currentGroup.messages.length - 1].created_at).getTime() < 5 * 60 * 1000 // 5 minutes
      ) {
        currentGroup.messages.push(message);
      } else {
        if (currentGroup) grouped.push(currentGroup);
        currentGroup = {
          userId: message.user_id,
          messages: [message]
        };
      }
    }
    if (currentGroup) grouped.push(currentGroup);
    return grouped;
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <div className="text-sm text-muted-foreground">Select a room to start chatting</div>
        <div className="text-xs text-muted-foreground/70 mt-1">Choose from the rooms above to join the conversation</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <div className="text-xs text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-sm text-destructive">Failed to load messages</div>
          <div className="text-xs text-muted-foreground">{error}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessages(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area - Maximized height */}
      <ScrollArea className="flex-1 px-2" ref={scrollAreaRef}>
        <div className="space-y-1 py-1">
          {messages.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-muted-foreground text-sm mb-1">No messages yet</div>
              <div className="text-xs text-muted-foreground/70">Start the conversation!</div>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => {
              const isOwn = group.userId === user?.id;
              return (
                <div key={groupIndex} className={cn("flex gap-2 mb-2", isOwn && "flex-row-reverse")}>
                  {!isOwn && (
                    <div className="flex-shrink-0 mt-auto">
                      <ChatMessageAvatar userId={group.userId} className="h-6 w-6" />
                    </div>
                  )}
                  <div className={cn("flex-1 space-y-0.5 min-w-0", isOwn && "flex-1")}>
                    {group.messages.map((message, messageIndex) => (
                      <div
                        key={message.id}
                        className={cn(
                          "group",
                          isOwn && "flex justify-end"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] px-2.5 py-1.5 rounded-lg text-sm break-words",
                            isOwn 
                              ? "bg-primary text-primary-foreground rounded-br-sm" 
                              : "bg-muted text-foreground rounded-bl-sm",
                            messageIndex === 0 && !isOwn && "rounded-tl-lg",
                            messageIndex === 0 && isOwn && "rounded-tr-lg"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          {messageIndex === group.messages.length - 1 && (
                            <div className={cn(
                              "text-xs mt-1 opacity-60 flex items-center gap-1",
                              isOwn ? "text-primary-foreground justify-end" : "text-muted-foreground"
                            )}>
                              <Clock className="h-3 w-3" />
                              {formatMessageTime(message.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
          
          {isSending && (
            <div className="flex justify-end mb-2">
              <div className="bg-muted/50 px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Sending...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Compact Input Area */}
      <div className="border-t bg-background/95 backdrop-blur flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-1.5 p-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 text-sm border-0 bg-muted/50 focus-visible:ring-1 h-8 rounded-md"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isSending}
            className="px-2.5 shrink-0 h-8"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompactMessageArea;