
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import RoomList from './RoomList';
import MessageArea from './MessageArea';
import { ChatRoom } from '@/types/chat';

const ChatContainer: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const isMobile = useIsMobile();

  if (isMobile && selectedRoom) {
    return (
      <div className="h-full">
        <MessageArea 
          room={selectedRoom} 
          onBack={() => setSelectedRoom(null)} 
        />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className={`${isMobile ? 'w-full' : 'w-80'} border-r border-border`}>
        <RoomList 
          selectedRoom={selectedRoom}
          onRoomSelect={setSelectedRoom}
        />
      </div>
      
      {!isMobile && (
        <div className="flex-1">
          {selectedRoom ? (
            <MessageArea room={selectedRoom} />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/30">
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-2">Welcome to Team Chat</h3>
                <p className="text-muted-foreground">
                  Select a room to start messaging with your team
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
