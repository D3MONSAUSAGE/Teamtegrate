
import React from 'react';
import { Card } from '@/components/ui/card';

const ChatRoomsLoadingState: React.FC = () => {
  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat rooms...</div>
      </div>
    </Card>
  );
};

export default ChatRoomsLoadingState;
