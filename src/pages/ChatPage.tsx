
import React, { useState } from 'react';
import ChatRooms from '@/components/chat/ChatRooms';
import ChatRoom from '@/components/chat/ChatRoom';
import ChatLayout from '@/components/chat/ChatLayout';
import { useIsMobile } from '@/hooks/use-mobile';

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string } | null>(null);
  const isMobile = useIsMobile();

  // On mobile, show either the room list or the selected chat room
  if (isMobile && selectedRoom) {
    return <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} />;
  }

  return (
    <ChatLayout
      sidebarContent={<ChatRooms selectedRoom={selectedRoom} onRoomSelect={setSelectedRoom} />}
      mainContent={
        selectedRoom ? (
          <ChatRoom room={selectedRoom} />
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
    />
  );
};

export default ChatPage;
