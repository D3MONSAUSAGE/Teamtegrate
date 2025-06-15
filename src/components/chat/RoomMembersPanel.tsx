
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserPlus, MoreVertical, Crown, Shield, User, UserMinus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ChatMessageAvatar from './ChatMessageAvatar';
import { Badge } from '@/components/ui/badge';

interface RoomMembersPanelProps {
  roomId: string;
  canManage: boolean;
  onAddMember: () => void;
}

interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    name: string;
    email: string;
  };
}

const RoomMembersPanel: React.FC<RoomMembersPanelProps> = ({ roomId, canManage, onAddMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          user:users(name, email)
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      return data as Member[];
    },
  });

  const filteredMembers = members.filter(member =>
    member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      toast.success('Member removed from room');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      toast.success('Member role updated');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update member role');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3" />;
      case 'moderator': return <Shield className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moderator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Members ({members.length})</h3>
          {canManage && (
            <Button onClick={onAddMember} size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Members List */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No members found' : 'No members yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ChatMessageAvatar userId={member.user_id} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {member.user.name}
                        {member.user_id === currentUser?.id && ' (You)'}
                      </p>
                      <Badge variant="secondary" className={`text-xs ${getRoleColor(member.role)}`}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                </div>

                {canManage && member.user_id !== currentUser?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'admin')}>
                        <Crown className="h-4 w-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'moderator')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Make Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                        <User className="h-4 w-4 mr-2" />
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default RoomMembersPanel;
