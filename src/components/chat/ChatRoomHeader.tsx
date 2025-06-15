
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogOut, UserPlus, Trash2, MoreVertical, Settings, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import ChatParticipants from './ChatParticipants';
import ChatSoundSettings from './ChatSoundSettings';
import DeleteChatRoomDialog from './DeleteChatRoomDialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatRoomHeaderProps {
  room: { id: string; name: string; created_by: string };
  isMobile?: boolean;
  currentUserId?: string;
  onBack?: () => void;
  toggleParticipants: () => void;
  onLeave: () => void;
  onDelete?: () => void;
  onAddMember?: () => void;
  onShowSettings?: () => void;
  leaving: boolean;
  canDelete: boolean;
}

const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  room, 
  currentUserId, 
  onBack, 
  toggleParticipants, 
  onLeave, 
  onDelete, 
  onAddMember,
  onShowSettings,
  leaving,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { canDeleteRoom, canAddParticipants } = useChatPermissions();
  const mobile = useIsMobile();

  const canUserDeleteRoom = canDeleteRoom(room.created_by);
  const canUserAddParticipants = canAddParticipants(room.created_by);

  const handleDeleteRoom = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-3 md:p-4 border-b border-border dark:border-gray-800 flex items-center justify-between bg-card dark:bg-[#1f2133] shadow-sm min-h-[60px]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {mobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="dark:hover:bg-gray-800/50 flex-shrink-0 h-10 w-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium flex-shrink-0">
          {room.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-base md:text-lg truncate">{room.name}</h2>
          <div className="text-xs text-muted-foreground">
            <ChatParticipants roomId={room.id} compact showAddButton={false} />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 items-center flex-shrink-0">
        {!mobile && <ChatSoundSettings />}
        
        {mobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={toggleParticipants}>
                <Users className="h-4 w-4 mr-2" />
                Show Members
              </DropdownMenuItem>
              {canUserAddParticipants && onAddMember && (
                <DropdownMenuItem onClick={onAddMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </DropdownMenuItem>
              )}
              {canUserDeleteRoom && onShowSettings && (
                <DropdownMenuItem onClick={onShowSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Room Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <ChatSoundSettings />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canUserDeleteRoom && (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat Room
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-red-600"
                onClick={onLeave}
                disabled={leaving}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleParticipants}
              className="flex-shrink-0"
              title="Show Members"
            >
              <Users className="h-5 w-5" />
            </Button>

            {canUserAddParticipants && onAddMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddMember}
                className="flex-shrink-0"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            )}

            {canUserDeleteRoom && onShowSettings && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShowSettings}
                className="flex-shrink-0"
                title="Room Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            {canUserDeleteRoom && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete Chat Room"
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
          </>
        )}
      </div>

      <DeleteChatRoomDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteRoom}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ChatRoomHeader;
