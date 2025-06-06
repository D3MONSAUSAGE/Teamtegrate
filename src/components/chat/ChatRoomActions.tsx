
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import AddChatParticipantDialog from './AddChatParticipantDialog';
import DeleteChatRoomDialog from './DeleteChatRoomDialog';
import { playSuccessSound } from '@/utils/sounds';
import { toast } from 'sonner';

interface ChatRoomActionsProps {
  roomId: string;
  isCreator: boolean;
  handleDeleteRoom: () => Promise<void>;
  isDeleting: boolean;
}

const ChatRoomActions: React.FC<ChatRoomActionsProps> = ({
  roomId,
  isCreator,
  handleDeleteRoom,
  isDeleting
}) => {
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleParticipantAdded = () => {
    playSuccessSound();
    toast.success('Member added to the chat room');
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <Button variant="outline" size="sm" onClick={() => setShowAddParticipant(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Add Member
        </Button>
      </div>

      {showAddParticipant && (
        <AddChatParticipantDialog
          open={showAddParticipant}
          onOpenChange={setShowAddParticipant}
          roomId={roomId}
          onAdded={handleParticipantAdded}
        />
      )}
      
      {isCreator && showDeleteConfirm && (
        <DeleteChatRoomDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDeleteRoom}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default ChatRoomActions;
