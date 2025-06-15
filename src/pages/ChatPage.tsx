
import React from 'react';
import EnhancedChatContainer from '@/components/chat/EnhancedChatContainer';

const ChatPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <EnhancedChatContainer />
    </div>
  );
};

export default ChatPage;
