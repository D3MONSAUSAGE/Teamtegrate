import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CompactMessageAreaProps {
  roomId: string | null;
}

const CompactMessageArea: React.FC<CompactMessageAreaProps> = ({ roomId }) => {
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useMessages(roomId);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

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

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-48 text-center p-4">
        <div className="text-sm text-muted-foreground">Select a room to start chatting</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-60">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-3 py-2" ref={scrollAreaRef}>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <div className={`text-xs mt-1 opacity-70 ${
                      isOwn ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {isSending && (
            <div className="flex justify-end">
              <div className="bg-muted px-3 py-2 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isSending}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompactMessageArea;