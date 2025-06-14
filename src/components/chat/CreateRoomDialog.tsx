
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateRoomDialogProps {
  onRoomCreated: () => void;
  canCreate: boolean;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({ onRoomCreated, canCreate }) => {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim() || !user) {
      toast.error('Please enter a room name');
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('Creating room:', roomName, 'for user:', user.id, 'org:', user.organizationId);
      
      // With the new simplified RLS policies, this will work if user has manager+ role
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([{
          name: roomName.trim(),
          created_by: user.id,
          organization_id: user.organizationId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        throw error;
      }

      console.log('Room created successfully:', data);
      toast.success('Chat room created successfully!');
      
      setRoomName('');
      setOpen(false);
      onRoomCreated();
      
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error(`Failed to create room: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!canCreate) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              disabled={isCreating}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !roomName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
