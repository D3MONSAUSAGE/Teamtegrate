
import React, { useState, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AddChatParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  existingParticipants: string[];
  onParticipantsAdded: () => void;
}

const AddChatParticipantDialog: React.FC<AddChatParticipantDialogProps> = ({
  isOpen,
  onClose,
  roomId,
  existingParticipants,
  onParticipantsAdded
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && user?.organizationId) {
      fetchAvailableUsers();
    }
  }, [isOpen, user]);

  const fetchAvailableUsers = async () => {
    if (!user?.organizationId) return;

    setIsLoading(true);
    try {
      // Fetch users from the same organization who aren't already participants
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('organization_id', user.organizationId)
        .not('id', 'in', `(${existingParticipants.join(',')})`);

      if (error) throw error;

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) return;

    setIsAdding(true);
    try {
      // Add participants to the chat room
      const participantData = selectedUsers.map(userId => ({
        room_id: roomId,
        user_id: userId,
        added_by: user?.id,
      }));

      const { error } = await supabase
        .from('chat_room_participants')
        .insert(participantData);

      if (error) throw error;

      toast.success(`Added ${selectedUsers.length} participant(s) to the chat`);
      onParticipantsAdded();
      onClose();
      setSelectedUsers([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding participants:', error);
      toast.error('Failed to add participants');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Participants</DialogTitle>
          <DialogDescription>
            Select users from your organization to add to this chat room.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No available users to add'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddParticipants}
            disabled={selectedUsers.length === 0 || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${selectedUsers.length} Participant${selectedUsers.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatParticipantDialog;
