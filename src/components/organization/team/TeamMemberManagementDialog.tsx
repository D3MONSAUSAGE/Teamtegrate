import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  UserCog, 
  ArrowRightLeft,
  Loader2,
  Crown,
  Shield,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from '@/components/ui/sonner';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import AddUserToTeamDialog from './AddUserToTeamDialog';
import { TeamTransferDialog } from '@/components/team/TeamTransferDialog';

interface Team {
  id: string;
  name: string;
  description?: string;
  manager_name?: string;
  member_count: number;
}

interface TeamMemberManagementDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamMemberManagementDialog: React.FC<TeamMemberManagementDialogProps> = ({
  team,
  open,
  onOpenChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  const { teamMembers, isLoading, refetch } = useRealTeamMembers(team.id);
  const { removeTeamMember, updateTeamMemberRole } = useTeamMemberOperations();
  const { teams } = useTeamAccess();

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    try {
      await removeTeamMember(team.id, memberId);
      toast.success('Member removed successfully');
      refetch();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'manager' | 'admin' | 'member') => {
    try {
      await updateTeamMemberRole(team.id, memberId, newRole);
      toast.success('Role updated successfully');
      refetch();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleTransferMember = (member: any) => {
    console.log('Transfer member clicked:', member);
    setSelectedMember(member);
    setTransferDialogOpen(true);
  };

  const onMemberAdded = () => {
    refetch();
    setAddUserDialogOpen(false);
  };

  const onMemberTransferred = () => {
    refetch();
    setTransferDialogOpen(false);
    setSelectedMember(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Team Members - {team.name}
            </DialogTitle>
            <DialogDescription>
              Search, add, remove, and manage roles for team members. You can also transfer members to other teams.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setAddUserDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading members...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No members found matching your search.' : 'No team members yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name || 'Unknown'}</span>
                            {member.role === 'manager' && <Crown className="h-3 w-3 text-yellow-500" />}
                            {member.role === 'admin' && <Shield className="h-3 w-3 text-orange-500" />}
                            {member.role === 'member' && <User className="h-3 w-3 text-blue-500" />}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.email || 'No email'}
                          </div>
                        </div>
                        <Badge variant={member.role === 'manager' ? 'default' : member.role === 'admin' ? 'destructive' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => console.log('Dropdown trigger clicked for member:', member.name)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-[10000]">
                          {member.role !== 'manager' && (
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(member.id, 'manager')}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Make Manager
                            </DropdownMenuItem>
                          )}
                          {member.role !== 'admin' && (
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(member.id, 'admin')}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {member.role !== 'member' && (
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(member.id, 'member')}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={(e) => {
                              console.log('Transfer clicked, event:', e);
                              e.preventDefault();
                              e.stopPropagation();
                              handleTransferMember(member);
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Transfer to Team
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              console.log('Remove member clicked');
                              handleRemoveMember(member.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
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

      {/* Add User Dialog */}
      <AddUserToTeamDialog
        team={team}
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onMemberAdded={onMemberAdded}
      />

      {/* Transfer Dialog */}
      {selectedMember && (
        <TeamTransferDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          member={selectedMember}
          currentTeamId={team.id}
        />
      )}
    </>
  );
};

export default TeamMemberManagementDialog;