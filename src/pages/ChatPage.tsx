
import React from 'react';
import ChatRooms from '@/components/chat/ChatRooms';
import { Button } from '@/components/ui/button';

const ChatPage = () => {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Team Chat</h1>
      <ChatRooms />
    </div>
  );
};

export default ChatPage;
