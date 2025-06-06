
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogOut, UserPlus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import ChatParticipants from './ChatParticipants';
import AddChatParticipantDialog from './AddChatParticipantDialog';
import DeleteChatRoomDialog from './DeleteChatRoomDialog';
import { toast } from 'sonner';
import { playSuccessSound } from '@/utils/sounds';

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
}) => {
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleParticipantAdded = () => {
    playSuccessSound();
    toast.success('Member added to the chat room');
  };

  const handleDeleteRoom = async () => {
    if (onDelete) {
      await onDelete();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="p-2 border-b border-border dark:border-gray-800 flex items-center justify-between bg-card dark:bg-[#1f2133] shadow-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="dark:hover:bg-gray-800/50 flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium flex-shrink-0">
          {room.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-base truncate">{room.name}</h2>
          <div className="text-xs text-muted-foreground">
            <ChatParticipants roomId={room.id} compact showAddButton={false} />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddParticipant(true)}
          className="flex-shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>
      
      <div className="flex gap-1 items-center flex-shrink-0">
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More options" className="dark:hover:bg-gray-800/50">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddChatParticipantDialog
        open={showAddParticipant}
        onOpenChange={setShowAddParticipant}
        roomId={room.id}
        onAdded={handleParticipantAdded}
      />

      <DeleteChatRoomDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteRoom}
        isDeleting={false}
      />
    </div>
  );
};

export default ChatRoomHeader;
