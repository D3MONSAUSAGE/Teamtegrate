
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessageAvatar from './ChatMessageAvatar';
import { Checkbox } from '@/components/ui/checkbox';

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onUsersAdded?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  onUsersAdded
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['organization-users', currentUser?.organizationId],
    queryFn: async () => {
      if (!currentUser?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', currentUser.organizationId)
        .neq('id', currentUser.id);

      if (error) throw error;
      return data as User[];
    },
    enabled: open && !!currentUser?.organizationId,
  });

  // Get existing room members to filter them out
  const { data: existingMembers = [] } = useQuery({
    queryKey: ['room-members-ids', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (error) throw error;
      return data.map(m => m.user_id);
    },
    enabled: open,
  });

  const filteredUsers = users.filter(user =>
    !existingMembers.includes(user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      
      const participantsToAdd = selectedUsers.map(userId => ({
        room_id: roomId,
        user_id: userId,
        role: 'member' as const
      }));

      const { error } = await supabase
        .from('chat_participants')
        .insert(participantsToAdd);

      if (error) throw error;

      toast.success(`Added ${selectedUsers.length} member(s) to the room`);
      setSelectedUsers([]);
      setSearchTerm('');
      onOpenChange(false);
      onUsersAdded?.();
    } catch (error) {
      console.error('Error adding users:', error);
      toast.error('Failed to add users to room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members to Chat Room</DialogTitle>
          <DialogDescription>
            Search and select organization members to add to this chat room.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedUsers.length} user(s) selected
            </div>
          )}

          {/* Users List */}
          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'No users found' : 'All organization members are already in this room'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <ChatMessageAvatar userId={user.id} className="h-8 w-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUsers} 
              disabled={loading || selectedUsers.length === 0}
            >
              {loading ? 'Adding...' : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : 'Members'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearchDialog;
