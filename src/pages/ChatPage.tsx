
import React, { useState } from 'react';
import ChatRooms from '@/components/chat/ChatRooms';
import ChatRoom from '@/components/chat/ChatRoom';
import ChatLayout from '@/components/chat/ChatLayout';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Handle room deletion
  const handleRoomDeleted = () => {
    setSelectedRoom(null);
  };

  // On mobile, show either the room list or the selected chat room
  if (isMobile && selectedRoom) {
    return <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} onRoomDeleted={handleRoomDeleted} />;
  }

  return (
    <div className="no-scrollbar overflow-hidden h-full">
      <ChatLayout
        sidebarContent={
          <div className="no-scrollbar overflow-hidden h-full">
            <ChatRooms selectedRoom={selectedRoom} onRoomSelect={setSelectedRoom} />
          </div>
        }
        mainContent={
          selectedRoom ? (
            <div className="no-scrollbar overflow-hidden h-full">
              <ChatRoom room={selectedRoom} onRoomDeleted={handleRoomDeleted} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/20 via-transparent to-muted/10">
              <div className="text-center p-8 glass-card rounded-2xl animate-scale-in max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Welcome to Team Chat
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Select a chat room to start messaging with your team members and collaborate in real-time.
                </p>
              </div>
            </div>
          )
        }
      />
    </div>
  );
};

export default ChatPage;
