import React, { useState } from 'react';
import ChatRooms from '@/components/chat/ChatRooms';
import ChatRoom from '@/components/chat/ChatRoom';
import ChatLayout from '@/components/chat/ChatLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bot } from 'lucide-react';
import AIChatAssistant from '@/components/chat/AIChatAssistant';

// Update the interface to match the expected ChatRoomData type
interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('team');
  const isMobile = useIsMobile();

  // Handle room deletion
  const handleRoomDeleted = () => {
    setSelectedRoom(null);
  };

  // On mobile, show either the room list or the selected chat room for team chat
  // But always show AI assistant when that tab is selected
  const renderContent = () => {
    // If in AI tab, always show the AI assistant
    if (activeTab === 'ai') {
      return <AIChatAssistant />;
    }
    
    // If in team tab and on mobile with a selected room
    if (isMobile && selectedRoom) {
      return <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} onRoomDeleted={handleRoomDeleted} />;
    }
    
    // Otherwise show the layout with sidebar
    return (
      <ChatLayout
        sidebarContent={
          <ChatRooms selectedRoom={selectedRoom} onRoomSelect={setSelectedRoom} />
        }
        mainContent={
          selectedRoom ? (
            <ChatRoom room={selectedRoom} onRoomDeleted={handleRoomDeleted} />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/30 dark:bg-muted/10">
              <div className="text-center p-8">
                <h3 className="text-xl font-medium mb-2">Welcome to Team Chat</h3>
                <p className="text-muted-foreground">
                  Select a chat room to start messaging with your team
                </p>
              </div>
            </div>
          )
        }
        fullWidth
      />
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <div className="border-b px-4 py-2 sticky top-0 z-10 bg-background">
          <TabsList className="w-full justify-start md:justify-start">
            <TabsTrigger value="team" className="flex items-center gap-2 flex-1 md:flex-none">
              <MessageSquare className="h-4 w-4" />
              <span>Team Chat</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 flex-1 md:flex-none">
              <Bot className="h-4 w-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </Tabs>
    </div>
  );
};

export default ChatPage;
