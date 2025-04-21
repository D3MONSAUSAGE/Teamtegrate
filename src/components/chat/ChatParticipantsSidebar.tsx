
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ChatParticipants from './ChatParticipants';

interface ChatParticipantsSidebarProps {
  roomId: string;
  onClose: () => void;
}

const ChatParticipantsSidebar: React.FC<ChatParticipantsSidebarProps> = ({
  roomId, onClose
}) => (
  <div className="absolute right-0 top-0 h-full w-64 bg-background dark:bg-[#1f2133] border-l border-border dark:border-gray-800 z-10 shadow-lg">
    <div className="p-4 border-b border-border">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Participants</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
    <div className="p-2">
      <ChatParticipants roomId={roomId} />
    </div>
  </div>
);

export default ChatParticipantsSidebar;
