
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

  // On mobile, show either the room list or the selected chat room
  if (isMobile && selectedRoom) {
    return <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} onRoomDeleted={handleRoomDeleted} />;
  }

  // Display either Team Chat or AI Assistant based on active tab
  const renderMainContent = () => {
    if (activeTab === 'team') {
      return selectedRoom ? (
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
      );
    } else {
      return <AIChatAssistant />;
    }
  };

  const renderSidebarContent = () => {
    if (activeTab === 'team') {
      return <ChatRooms selectedRoom={selectedRoom} onRoomSelect={setSelectedRoom} />;
    } else {
      // Empty sidebar when in AI chat mode on mobile
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground text-sm p-4 text-center">
            AI Assistant is active
          </p>
        </div>
      );
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <div className="border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Team Chat</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="team" className="h-full m-0 p-0">
            <ChatLayout
              sidebarContent={renderSidebarContent()}
              mainContent={renderMainContent()}
              fullWidth
            />
          </TabsContent>
          <TabsContent value="ai" className="h-full m-0 p-0">
            <ChatLayout
              sidebarContent={renderSidebarContent()}
              mainContent={renderMainContent()}
              fullWidth
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ChatPage;
