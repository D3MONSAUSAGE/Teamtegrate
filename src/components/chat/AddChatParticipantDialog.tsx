
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingUser, setAddingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', user.organizationId)
        .neq('id', user.id);

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as any,
        organizationId: u.organization_id,
        timezone: u.timezone || 'UTC',
        createdAt: new Date(u.created_at),
        avatar_url: u.avatar_url
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, user?.organizationId]);

  const addParticipant = async (userId: string) => {
    try {
      setAddingUser(userId);
      const { error } = await supabase
        .from('chat_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          added_by: user?.id
        });

      if (error) throw error;

      toast.success('Participant added successfully');
      onParticipantAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setAddingUser(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Add a team member to this chat room.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <Input
              id="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No users found
              </p>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addParticipant(u.id)}
                    disabled={addingUser === u.id}
                  >
                    {addingUser === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatParticipantDialog;
