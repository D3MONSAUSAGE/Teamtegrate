import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  UserPlus, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface AddUserToTeamDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: () => void;
}

const AddUserToTeamDialog: React.FC<AddUserToTeamDialogProps> = ({
  team,
  open,
  onOpenChange,
  onMemberAdded,
}) => {
  const { user: currentUser } = useAuth();
  const { addTeamMember } = useTeamMemberOperations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [defaultRole, setDefaultRole] = useState<'manager' | 'member' | 'admin'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available users (not in current team)
  useEffect(() => {
    if (open && currentUser?.organizationId) {
      fetchAvailableUsers();
    }
  }, [open, team.id, currentUser?.organizationId]);

  const fetchAvailableUsers = async () => {
    setIsLoading(true);
    try {
      // Get all users in the organization
      const { data: orgUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('organization_id', currentUser?.organizationId);

      if (usersError) throw usersError;

      // Get current team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', team.id);

      if (membersError) throw membersError;

      // Filter out users already in the team
      const teamMemberIds = new Set(teamMembers?.map(m => m.user_id) || []);
      const available = orgUsers?.filter(user => !teamMemberIds.has(user.id)) || [];

      setAvailableUsers(available);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast.error('Failed to load available users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAddUsers = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSubmitting(true);
    try {
      // Add each selected user to the team
      const addPromises = Array.from(selectedUsers).map(userId =>
        addTeamMember(team.id, userId, defaultRole)
      );

      await Promise.all(addPromises);

      toast.success(`Successfully added ${selectedUsers.size} user(s) to ${team.name}`);
      setSelectedUsers(new Set());
      setSearchTerm('');
      onMemberAdded();
    } catch (error) {
      console.error('Error adding users to team:', error);
      toast.error('Failed to add users to team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Users to {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={defaultRole} onValueChange={(value: 'manager' | 'member' | 'admin') => setDefaultRole(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.size === filteredUsers.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({filteredUsers.length})
                </label>
                {selectedUsers.size > 0 && (
                  <Badge variant="secondary">
                    {selectedUsers.size} selected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading available users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No users found matching your search.' 
                    : 'All users are already in this team or no users available.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUsers} 
              disabled={selectedUsers.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}User{selectedUsers.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserToTeamDialog;