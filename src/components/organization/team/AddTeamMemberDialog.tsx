
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Search, 
  Loader2,
  Users,
  X 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { Team } from '@/types/teams';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onMemberAdded: () => void;
  existingMemberIds: string[];
}

const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({
  open,
  onOpenChange,
  team,
  onMemberAdded,
  existingMemberIds,
}) => {
  const { user } = useAuth();
  const { addTeamMember } = useTeamManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [memberRole, setMemberRole] = useState<'manager' | 'member'>('member');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch available users
  const { data: availableUsers = [], isLoading } = useQuery({
    queryKey: ['available-users', user?.organizationId, existingMemberIds],
    queryFn: async (): Promise<User[]> => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('organization_id', user.organizationId)
        .not('id', 'in', `(${existingMemberIds.join(',')})`)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId && open,
  });

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (user: User, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleRemoveSelected = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleAddMembers = async () => {
    if (!team || selectedUsers.length === 0) return;
    
    setIsAdding(true);
    try {
      // Add each selected user to the team
      for (const selectedUser of selectedUsers) {
        await addTeamMember(team.id, selectedUser.id, memberRole);
      }
      
      // Reset form and close dialog
      setSelectedUsers([]);
      setSearchTerm('');
      setMemberRole('member');
      onMemberAdded();
    } catch (error) {
      console.error('Error adding team members:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchTerm('');
    setMemberRole('member');
    onOpenChange(false);
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Members to {team.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Member Role</Label>
            <Select value={memberRole} onValueChange={(value) => setMemberRole(value as 'manager' | 'member')}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Members ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-24 overflow-y-auto">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="gap-1">
                    {user.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveSelected(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            <Label>Available Users</Label>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No users found matching your search.' : 'No available users to add.'}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.some(u => u.id === user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => handleUserToggle(user, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleUserToggle(user, !!checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMembers} 
              disabled={selectedUsers.length === 0 || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding Members...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;
