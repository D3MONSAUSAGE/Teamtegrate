
import React from 'react';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import ModernChatContainer from '@/components/chat/ModernChatContainer';
import { MessageSquare } from 'lucide-react';

const ChatPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 h-screen flex flex-col space-y-6">
        <ModernPageHeader
          title="Messages"
          subtitle="Connect and collaborate with your team"
          icon={MessageSquare}
          badges={[
            { label: 'Real-time', variant: 'default' }
          ]}
        />
        <div className="flex-1 min-h-0">
          <ModernChatContainer />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
