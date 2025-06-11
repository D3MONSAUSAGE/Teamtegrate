import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { toast } from '@/components/ui/sonner';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AddChatParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onParticipantAdded?: () => void;
}

const AddChatParticipantDialog: React.FC<AddChatParticipantDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  onParticipantAdded
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUsers = useCallback(async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.organizationId]);

  const addParticipant = async (userId: string) => {
    if (!user?.organizationId) return;

    try {
      const { error } = await supabase
        .from('chat_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          added_by: user.id,
          organization_id: user.organizationId
        });

      if (error) throw error;

      onParticipantAdded?.();
      onOpenChange(false);
      toast.success('Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Select a user to add to the chat room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div>Loading users...</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                  <AvatarFallback>{(user.name || user.email).substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => addParticipant(user.id)} className="ml-auto">
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatParticipantDialog;
