
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
import { Search, UserPlus, Check, AlertCircle, RefreshCw } from 'lucide-react';
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

  const { data: users = [], isLoading, error: usersError, refetch } = useQuery({
    queryKey: ['organization-users', currentUser?.organizationId, searchTerm],
    queryFn: async () => {
      if (!currentUser?.organizationId) {
        console.error('UserSearchDialog: No organization ID available');
        console.error('UserSearchDialog: Current user:', currentUser);
        throw new Error('No organization ID available');
      }
      
      console.log('UserSearchDialog: Searching for users in org:', currentUser.organizationId);
      console.log('UserSearchDialog: Search term:', searchTerm);
      
      let query = supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', currentUser.organizationId)
        .neq('id', currentUser.id);

      // Add search filtering if there's a search term
      if (searchTerm.trim()) {
        // Use ilike for case-insensitive search
        query = query.or(`name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%`);
      }

      const { data, error } = await query
        .order('name')
        .limit(50);

      if (error) {
        console.error('UserSearchDialog: Error fetching users:', error);
        throw error;
      }
      
      console.log('UserSearchDialog: Found users:', data?.length || 0);
      console.log('UserSearchDialog: Users data:', data);
      
      return (data as User[]) || [];
    },
    enabled: open && !!currentUser?.organizationId,
    retry: 2,
  });

  // Get existing room members to filter them out
  const { data: existingMembers = [] } = useQuery({
    queryKey: ['room-members-ids', roomId],
    queryFn: async () => {
      console.log('UserSearchDialog: Fetching existing members for room:', roomId);
      
      const { data, error } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (error) {
        console.error('UserSearchDialog: Error fetching room members:', error);
        throw error;
      }
      
      console.log('UserSearchDialog: Existing members:', data?.length || 0);
      return data?.map(m => m.user_id) || [];
    },
    enabled: open,
  });

  const filteredUsers = users.filter(user => !existingMembers.includes(user.id));

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    if (!currentUser?.organizationId) {
      toast.error('Organization information not available. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      console.log('UserSearchDialog: Adding users to room:', { roomId, selectedUsers });
      
      const participantsToAdd = selectedUsers.map(userId => ({
        room_id: roomId,
        user_id: userId,
        role: 'member' as const
      }));

      console.log('UserSearchDialog: Participants to add:', participantsToAdd);

      const { error } = await supabase
        .from('chat_participants')
        .insert(participantsToAdd);

      if (error) {
        console.error('UserSearchDialog: Error adding participants:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          toast.error('One or more users are already members of this room');
        } else if (error.message.includes('organization')) {
          toast.error('Users must be in the same organization to join this room');
        } else {
          toast.error(`Failed to add users: ${error.message}`);
        }
        throw error;
      }

      console.log('UserSearchDialog: Successfully added participants');
      
      const addedUserNames = users
        .filter(u => selectedUsers.includes(u.id))
        .map(u => u.name || u.email)
        .join(', ');
      
      toast.success(`Added ${selectedUsers.length} member(s) to the room: ${addedUserNames}`);
      setSelectedUsers([]);
      setSearchTerm('');
      onOpenChange(false);
      onUsersAdded?.();
    } catch (error: any) {
      console.error('UserSearchDialog: Failed to add users:', error);
      // Error already handled above with specific messages
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  // Debug info
  React.useEffect(() => {
    if (open) {
      console.log('UserSearchDialog: Dialog opened with state:', {
        currentUser: currentUser?.email,
        organizationId: currentUser?.organizationId,
        roomId,
        searchTerm,
        usersFound: users.length,
        existingMembers: existingMembers.length,
        filteredUsers: filteredUsers.length,
        hasOrgId: !!currentUser?.organizationId
      });
      
      if (!currentUser?.organizationId) {
        console.error('UserSearchDialog: CRITICAL - No organization ID available!');
      }
    }
  }, [open, currentUser, roomId, searchTerm, users.length, existingMembers.length, filteredUsers.length]);

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
          {/* Organization Check Warning */}
          {!currentUser?.organizationId && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">Organization Error</p>
                <p>Your organization information is not available. Please refresh the page and try again.</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email (e.g., 'Dulce')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={!currentUser?.organizationId}
            />
          </div>

          {/* Debug info for troubleshooting */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded space-y-1">
              <div>Debug Info:</div>
              <div>• Organization ID: {currentUser?.organizationId || 'MISSING'}</div>
              <div>• Users found: {users.length}</div>
              <div>• Existing members: {existingMembers.length}</div>
              <div>• Available to add: {filteredUsers.length}</div>
              <div>• Search term: "{searchTerm}"</div>
            </div>
          )}

          {/* Error display */}
          {usersError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Error loading users</p>
                <p>{usersError.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

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
            ) : !currentUser?.organizationId ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Organization information required to search for users
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? (
                    <>No users found matching "{searchTerm}"</>
                  ) : users.length === 0 ? (
                    'No organization members found'
                  ) : (
                    'All organization members are already in this room'
                  )}
                </p>
                {searchTerm && users.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term or check the spelling
                  </p>
                )}
                {searchTerm && users.length === 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Make sure the user:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Is in your organization</li>
                      <li>Has been added to the system</li>
                      <li>Name/email is spelled correctly</li>
                    </ul>
                  </div>
                )}
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
              disabled={loading || selectedUsers.length === 0 || !currentUser?.organizationId}
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
