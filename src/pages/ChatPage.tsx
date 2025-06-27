
import React from 'react';
import ChatPageHeader from '@/components/chat/ChatPageHeader';
import ModernChatContainer from '@/components/chat/ModernChatContainer';

const ChatPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="container mx-auto p-6 h-screen flex flex-col">
        <ChatPageHeader 
          activeUsers={5} // This would come from real data
          totalMessages={42} // This would come from real data
        />
        <div className="flex-1 min-h-0">
          <ModernChatContainer />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
