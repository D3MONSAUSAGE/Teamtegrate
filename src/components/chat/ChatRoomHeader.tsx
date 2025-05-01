
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogOut, Info, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import ChatParticipants from './ChatParticipants';

interface ChatRoomHeaderProps {
  room: { id: string; name: string; created_by: string };
  isMobile: boolean;
  currentUserId?: string;
  onBack?: () => void;
  toggleParticipants: () => void;
  onLeave: () => void;
  onDelete?: () => void;
  leaving: boolean;
  canDelete: boolean;
}

const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  room, isMobile, currentUserId, onBack, toggleParticipants, onLeave, onDelete, leaving, canDelete,
}) => (
  <div className="p-2 border-b border-border dark:border-gray-800 flex items-center gap-1 bg-card dark:bg-[#1f2133] shadow-sm">
    {isMobile && (
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onBack}
        className="dark:hover:bg-gray-800/50"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
    )}
    <div className="flex items-center gap-2">
      <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
        {room.name.substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h2 className="font-semibold text-base">{room.name}</h2>
        <div className="text-xs text-muted-foreground">
          <ChatParticipants roomId={room.id} compact />
        </div>
      </div>
    </div>
    <div className="ml-auto flex gap-2 items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleParticipants}
        className="dark:hover:bg-gray-800/50"
      >
        <Info className="h-5 w-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More options">
            <LogOut className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className="text-red-600 cursor-pointer"
            onClick={onLeave}
            disabled={leaving}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Chat
          </DropdownMenuItem>
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Room
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

export default ChatRoomHeader;
