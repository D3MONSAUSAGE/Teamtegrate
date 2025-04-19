
import React from 'react';
import ChatRooms from '@/components/chat/ChatRooms';

const ChatPage = () => {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatRooms />
      </div>
    </div>
  );
};

export default ChatPage;
