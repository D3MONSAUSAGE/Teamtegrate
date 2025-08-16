import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat } from '@/hooks/use-ai-chat';
import AIChatMessage from './AIChatMessage';

interface AIChatWidgetProps {
  onClose: () => void;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const { messages, isProcessing, sendMessage } = useAIChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim() || isProcessing) return;

    const messageText = input.trim();
    setInput('');
    await sendMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="w-80 h-96 shadow-xl animate-in slide-in-from-bottom-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Hi! I'm your AI assistant. How can I help you today?
              </div>
            ) : (
              messages.map((message) => (
                <AIChatMessage key={message.id} message={message} />
              ))
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isProcessing}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isProcessing}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatWidget;