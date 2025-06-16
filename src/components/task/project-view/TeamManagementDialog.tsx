
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  MoreVertical,
  Crown,
  Shield,
  User,
  UserMinus,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserType, Project } from '@/types';
import { useUsers } from '@/hooks/useUsers';

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  teamMembers: UserType[];
  isLoadingTeamMembers: boolean;
  onAddTeamMember: (userId: string) => void;
  onRemoveTeamMember: (userId: string) => void;
}

const TeamManagementDialog: React.FC<TeamManagementDialogProps> = ({
  open,
  onOpenChange,
  project,
  teamMembers,
  isLoadingTeamMembers,
  onAddTeamMember,
  onRemoveTeamMember
}) => {
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState('');
  const [availableUserSearchQuery, setAvailableUserSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const { users: allUsers, isLoading: isLoadingUsers } = useUsers();

  // Filter current team members based on team member search
  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(teamMemberSearchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(teamMemberSearchQuery.toLowerCase())
  );

  // Filter available users (excluding current team members) based on available user search
  const availableUsers = allUsers.filter(user => {
    const isAlreadyTeamMember = teamMembers.some(member => member.id === user.id);
    const matchesSearch = user.name.toLowerCase().includes(availableUserSearchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(availableUserSearchQuery.toLowerCase());
    return !isAlreadyTeamMember && matchesSearch;
  });

  const getRoleIcon = (userId: string) => {
    if (project.managerId === userId) {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    }
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getRoleLabel = (userId: string) => {
    if (project.managerId === userId) {
      return 'Project Manager';
    }
    return 'Team Member';
  };

  const handleAddMember = (userId: string) => {
    onAddTeamMember(userId);
    setShowAddMember(false);
    setAvailableUserSearchQuery('');
  };

  const handleRemoveMember = (userId: string) => {
    onRemoveTeamMember(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Team - {project.title}
          </DialogTitle>
          <DialogDescription>
            Add or remove team members and manage their roles for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 max-h-[60vh] overflow-hidden">
          {/* Add Member Section */}
          {!showAddMember ? (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddMember(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Add Team Members</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddMember(false);
                    setAvailableUserSearchQuery('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search for available users */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search available users..."
                  value={availableUserSearchQuery}
                  onChange={(e) => setAvailableUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-2">
                {isLoadingUsers ? (
                  <div className="text-center py-4">Loading available users...</div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {availableUserSearchQuery ? 'No users found matching your search' : 'No available users to add'}
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded border bg-card hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(user.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Current Team Members */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">
                Team Members ({teamMembers.length})
              </h4>
              
              {/* Search current team members */}
              <div className="relative flex-1 max-w-xs ml-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={teamMemberSearchQuery}
                  onChange={(e) => setTeamMemberSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoadingTeamMembers ? (
              <div className="text-center py-8">Loading team members...</div>
            ) : filteredTeamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {teamMemberSearchQuery ? 'No team members match your search' : 'No team members found'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {getRoleIcon(member.id)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {getRoleLabel(member.id)}
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {project.managerId !== member.id && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove from Project
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagementDialog;
