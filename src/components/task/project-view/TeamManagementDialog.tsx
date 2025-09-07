
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
  X,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User as UserType, Project, UserRole, getRoleDisplayName } from '@/types';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import OrganizationRoleChangeDialog from '@/components/team/OrganizationRoleChangeDialog';
import OrganizationRoleSelector from '@/components/team/OrganizationRoleSelector';

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
  const { user: currentUser } = useAuth();
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState('');
  const [availableUserSearchQuery, setAvailableUserSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isChangingOrgRole, setIsChangingOrgRole] = useState(false);
  const [orgRoleChangeData, setOrgRoleChangeData] = useState<{
    userId: string;
    userName: string;
    currentRole: UserRole;
    newRole: UserRole;
  } | null>(null);
  const { users: allUsers, isLoading: isLoadingUsers } = useUsers();

  const isSuperadmin = currentUser?.role === 'superadmin';

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
    toast.success('Team member added successfully');
  };

  const handleRemoveMember = (userId: string) => {
    setRemovingMemberId(userId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveMember = () => {
    if (removingMemberId) {
      onRemoveTeamMember(removingMemberId);
      toast.success('Team member removed successfully');
    }
    setShowRemoveDialog(false);
    setRemovingMemberId(null);
  };

  const handleEditMember = (memberId: string) => {
    // TODO: Implement member role/permissions editing
    toast.info('Member editing functionality coming soon');
  };

  const handleSendMessage = (memberId: string) => {
    // TODO: Implement team member messaging
    toast.info('Team messaging functionality coming soon');
  };

  const handleChangeOrganizationRole = (member: UserType, newRole: UserRole) => {
    setOrgRoleChangeData({
      userId: member.id,
      userName: member.name,
      currentRole: member.role as UserRole,
      newRole: newRole
    });
  };

  const confirmOrganizationRoleChange = async () => {
    if (!orgRoleChangeData) return;

    setIsChangingOrgRole(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-role', {
        body: {
          userId: orgRoleChangeData.userId,
          newRole: orgRoleChangeData.newRole
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to update role');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Role update failed');
      }

      toast.success(`Organization role updated to ${getRoleDisplayName(orgRoleChangeData.newRole)}`);
      setOrgRoleChangeData(null);
      
      // Refresh the team members list
      window.location.reload(); // Simple refresh to update roles
    } catch (error) {
      console.error('Error changing organization role:', error);
      toast.error('Failed to change organization role');
    } finally {
      setIsChangingOrgRole(false);
    }
  };

  const closeOrganizationRoleDialog = () => {
    if (!isChangingOrgRole) {
      setOrgRoleChangeData(null);
    }
  };

  const removingMember = removingMemberId ? teamMembers.find(m => m.id === removingMemberId) : null;

  return (
    <>
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
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(member.id)}
                            </Badge>
                            {isSuperadmin && (
                              <Badge variant="outline" className="text-xs">
                                {getRoleDisplayName(member.role as UserRole)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditMember(member.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project Role
                          </DropdownMenuItem>
                          
                          {isSuperadmin && member.id !== currentUser?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                Change Organization Role
                              </div>
                              <DropdownMenuItem onClick={() => handleChangeOrganizationRole(member, 'user')}>
                                <User className="h-4 w-4 mr-2" />
                                Set as User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeOrganizationRole(member, 'manager')}>
                                <Crown className="h-4 w-4 mr-2" />
                                Set as Manager
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeOrganizationRole(member, 'admin')}>
                                <Settings className="h-4 w-4 mr-2" />
                                Set as Admin
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSendMessage(member.id)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          
                          {project.managerId !== member.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove from Project
                              </DropdownMenuItem>
                            </>
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

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingMember?.name} from this project? 
              They will no longer have access to project tasks and updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Organization Role Change Dialog */}
    {orgRoleChangeData && (
      <OrganizationRoleChangeDialog
        isOpen={!!orgRoleChangeData}
        onClose={closeOrganizationRoleDialog}
        onConfirm={confirmOrganizationRoleChange}
        isChanging={isChangingOrgRole}
        targetUserName={orgRoleChangeData.userName}
        currentRole={orgRoleChangeData.currentRole}
        newRole={orgRoleChangeData.newRole}
      />
    )}
  </>
);
};

export default TeamManagementDialog;
