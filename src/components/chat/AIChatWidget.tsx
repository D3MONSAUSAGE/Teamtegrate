import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, Users, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIChat } from '@/hooks/use-ai-chat';
import AIChatMessage from './AIChatMessage';
import CompactRoomList from './CompactRoomList';
import CompactMessageArea from './CompactMessageArea';
import { useChatBubble } from '@/contexts/chat/ChatBubbleContext';

interface AIChatWidgetProps {
  onClose: () => void;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const { state, actions } = useChatBubble();
  const { messages, isProcessing, sendMessage } = useAIChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect for AI chat
  useEffect(() => {
    if (state.activeTab === 'ai' && scrollAreaRef.current) {
      requestAnimationFrame(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
    }
  }, [messages, state.activeTab]);


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
    <>
      {/* Streamlined Header - Only show when not in message view */}
      {!(state.activeTab === 'team' && state.selectedRoomId) && (
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-card/95 backdrop-blur-sm">
          <CardTitle className="text-sm font-medium text-card-foreground">Chat Hub</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-muted/50 mobile-touch-target"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      
      {/* Message View Header - Show when in chat room */}
      {state.activeTab === 'team' && state.selectedRoomId && (
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.setSelectedRoomId(null)}
              className="h-7 w-7 p-0 hover:bg-muted/50 shrink-0 mobile-touch-target"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium text-sm truncate text-card-foreground">Chat Room</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-muted/50 shrink-0 mobile-touch-target"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      
      <CardContent className="flex flex-col flex-1 p-0 min-h-0">
        <Tabs 
          value={state.activeTab} 
          onValueChange={actions.setActiveTab} 
          className="flex-1 flex flex-col min-h-0"
        >
          {/* Only show tabs when not in message view */}
          {!(state.activeTab === 'team' && state.selectedRoomId) && (
            <TabsList className="grid w-full grid-cols-2 mx-3 my-2 flex-shrink-0 h-9 bg-muted/50">
              <TabsTrigger value="ai" className="flex items-center gap-1.5 text-xs py-1.5 mobile-touch-target">
                <Bot className="h-3.5 w-3.5" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-1.5 text-xs py-1.5 mobile-touch-target">
                <Users className="h-3.5 w-3.5" />
                Team Chat
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="ai" className="flex-1 flex flex-col mt-0 min-h-0 data-[state=active]:flex">
            {/* AI Chat Messages Area */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full px-3 min-h-0" ref={scrollAreaRef}>
                <div className="space-y-3 py-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse mx-auto mb-3" />
                      Hi! I'm your AI assistant. How can I help you today?
                    </div>
                  ) : (
                    messages.map((message) => (
                      <AIChatMessage key={message.id} message={message} />
                    ))
                  )}
                  
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-muted-foreground px-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* AI Input Area - Protected from being hidden */}
            <div className="border-t bg-card/95 backdrop-blur-sm p-3 flex-shrink-0 sticky bottom-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isProcessing}
                  className="flex-1 text-sm border-0 bg-muted/50 focus-visible:ring-1 h-10 mobile-touch-target"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isProcessing}
                  className="px-4 h-10 mobile-touch-target"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="team" className="flex-1 flex flex-col mt-0 min-h-0 data-[state=active]:flex">
            {!state.selectedRoomId ? (
              /* Room List View */
              <div className="flex-1 min-h-0">
                <CompactRoomList
                  selectedRoomId={state.selectedRoomId}
                  onRoomSelect={actions.setSelectedRoomId}
                />
              </div>
            ) : (
              /* Message View - Full height usage */
              <div className="flex-1 min-h-0">
                <CompactMessageArea roomId={state.selectedRoomId} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
};

export default AIChatWidget;