
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    setIsCreating(true);
    try {
      // Create the chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName.trim(),
          created_by: user.id,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add the creator as a participant
      const { error: participantError } = await supabase
        .from('chat_room_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
          added_by: user.id,
        });

      if (participantError) throw participantError;

      toast.success('Chat room created successfully!');
      onRoomCreated();
      onClose();
      setRoomName('');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create chat room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
      setRoomName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Chat Room</DialogTitle>
          <DialogDescription>
            Create a new chat room for your team to collaborate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="Enter room name..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreateRoom();
                }
              }}
              disabled={isCreating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateRoom} disabled={!roomName.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Room'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
