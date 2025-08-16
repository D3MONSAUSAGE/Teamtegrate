import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, Users, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIChat } from '@/hooks/use-ai-chat';
import AIChatMessage from './AIChatMessage';
import CompactRoomList from './CompactRoomList';
import CompactMessageArea from './CompactMessageArea';

interface AIChatWidgetProps {
  onClose: () => void;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { messages, isProcessing, sendMessage } = useAIChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load last active tab from session storage
  useEffect(() => {
    const savedTab = sessionStorage.getItem('chatWidgetTab');
    if (savedTab && ['ai', 'team'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to session storage
  useEffect(() => {
    sessionStorage.setItem('chatWidgetTab', activeTab);
  }, [activeTab]);

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
    <Card className={`shadow-xl animate-in slide-in-from-bottom-2 transition-all duration-300 overflow-hidden ${
      activeTab === 'team' ? 'w-full max-w-[calc(100vw-1rem)] sm:max-w-md h-[600px]' : 'w-full max-w-[calc(100vw-1rem)] sm:max-w-sm h-96'
    }`}>
      {/* Streamlined Header - Only show when not in message view */}
      {!(activeTab === 'team' && selectedRoomId) && (
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between border-b bg-background/95 backdrop-blur">
          <CardTitle className="text-sm font-medium">Chat Hub</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      
      {/* Message View Header - Show when in chat room */}
      {activeTab === 'team' && selectedRoomId && (
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRoomId(null)}
              className="h-6 w-6 p-0 hover:bg-muted/50 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium text-sm truncate">Chat Room</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-muted/50 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      
      <CardContent className="flex flex-col flex-1 p-0 overflow-hidden min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          {/* Only show tabs when not in message view */}
          {!(activeTab === 'team' && selectedRoomId) && (
            <TabsList className="grid w-full grid-cols-2 mx-3 my-2 flex-shrink-0 h-8">
              <TabsTrigger value="ai" className="flex items-center gap-1 text-xs py-1">
                <Bot className="h-3 w-3" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-1 text-xs py-1">
                <Users className="h-3 w-3" />
                Team Chat
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="ai" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            {/* AI Chat Messages Area */}
            <ScrollArea className="flex-1 px-1 sm:px-3" ref={scrollAreaRef}>
              <div className="space-y-2 py-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-6">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mx-auto mb-2" />
                    Hi! I'm your AI assistant. How can I help you today?
                  </div>
                ) : (
                  messages.map((message) => (
                    <AIChatMessage key={message.id} message={message} />
                  ))
                )}
                
                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground px-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* AI Input Area */}
            <div className="border-t bg-background/95 backdrop-blur p-1 sm:p-2 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isProcessing}
                  className="flex-1 text-sm border-0 bg-muted/50 focus-visible:ring-1 h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isProcessing}
                  className="px-3 h-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="team" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            {!selectedRoomId ? (
              /* Room List View */
              <div className="flex-1 overflow-hidden">
                <CompactRoomList
                  selectedRoomId={selectedRoomId}
                  onRoomSelect={setSelectedRoomId}
                />
              </div>
            ) : (
              /* Message View - Full height usage */
              <div className="flex-1 min-h-0 overflow-hidden">
                <CompactMessageArea roomId={selectedRoomId} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIChatWidget;