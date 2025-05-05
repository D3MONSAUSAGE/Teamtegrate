
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/use-ai-chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Bot, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AIChatAssistant = () => {
  const { messages, isProcessing, sendMessage } = useAIChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background dark:bg-[#111827]">
      <div className="p-3 bg-primary text-primary-foreground flex items-center gap-2 border-b">
        <Bot className="h-5 w-5" />
        <h3 className="font-medium">AI Assistant</h3>
      </div>
      
      <ScrollArea 
        className={cn(
          "flex-1 p-4 bg-muted/20",
          isMobile && "touch-auto"
        )}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <div className="max-w-[250px]">
              <Bot className="h-12 w-12 mb-3 mx-auto text-muted-foreground opacity-80" />
              <h3 className="font-medium mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Ask me anything about tasks, projects, or how to use the app!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg rounded-bl-none px-4 py-3 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </ScrollArea>
      
      <form 
        onSubmit={handleSubmit} 
        className="p-3 bg-background border-t flex gap-2 sticky bottom-0"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI assistant..."
          className="resize-none min-h-[42px] max-h-[120px] text-sm p-2"
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!input.trim() || isProcessing}
          className="h-10 w-10 shrink-0"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default AIChatAssistant;
