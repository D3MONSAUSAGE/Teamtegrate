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
    <Card className={`shadow-xl animate-in slide-in-from-bottom-2 transition-all duration-300 ${
      activeTab === 'team' ? 'w-[420px] h-[520px]' : 'w-80 h-96'
    }`}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Chat Hub</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mx-4 mb-3 flex-shrink-0">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 flex flex-col mt-0">
            {/* AI Chat Messages Area */}
            <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
              <div className="space-y-3 pb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mx-auto mb-2" />
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

            {/* AI Input Area */}
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
              /* Message View */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Room Header with Back Button */}
                <div className="border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRoomId(null)}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">Chat Room</h3>
                  </div>
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CompactMessageArea roomId={selectedRoomId} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIChatWidget;