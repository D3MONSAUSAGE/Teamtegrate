import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, UserMinus, Crown, User, Users, ArrowUpDown } from 'lucide-react';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { TeamTransferDialog } from './TeamTransferDialog';
import { BulkTeamManagement } from './BulkTeamManagement';


export const TeamMembershipManager: React.FC = () => {
  const teamContext = useTeamContext();
  const { user } = useAuth();
  const [transferMember, setTransferMember] = useState(null);
  const [showBulkManagement, setShowBulkManagement] = useState(false);
  
  // Get team context
  const { selectedTeam, canManageTeam } = teamContext || {};
  
  // Fetch real team members
  const { teamMembers, isLoading: membersLoading } = useRealTeamMembers(selectedTeam?.id);
  const { removeTeamMember, updateTeamMemberRole } = useTeamMemberOperations();

  // Handle member operations
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
    try {
      await removeTeamMember(selectedTeam.id, memberId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'manager' | 'member') => {
    if (!selectedTeam) return;
    try {
      await updateTeamMemberRole(selectedTeam.id, memberId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  // Ensure context is available
  if (!teamContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading team membership data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a team to view members</p>
        </CardContent>
      </Card>
    );
  }

  const canManage = canManageTeam(selectedTeam.id);

  if (membersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading team members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} members in {selectedTeam.name}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && teamMembers.length > 1 && (
            <Button size="sm" variant="outline" onClick={() => setShowBulkManagement(true)}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Bulk Transfer
            </Button>
          )}
          {canManage && (
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                      {member.role === 'manager' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Manager
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Member
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                    <span>{member.totalTasks} tasks</span>
                    <span>{member.completionRate}% completion</span>
                  </div>
                </div>
              </div>
              
              {canManage && member.id !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(member.id, member.role === 'manager' ? 'member' : 'manager')}
                    >
                      {member.role === 'manager' ? 'Make Member' : 'Make Manager'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTransferMember(member)}>
                      <Users className="h-4 w-4 mr-2" />
                      Transfer to Team
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove from Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Transfer Dialog */}
      <TeamTransferDialog
        open={!!transferMember}
        onOpenChange={(open) => !open && setTransferMember(null)}
        member={transferMember}
        currentTeamId={selectedTeam.id}
      />

      {/* Bulk Management Dialog */}
      <BulkTeamManagement
        open={showBulkManagement}
        onOpenChange={setShowBulkManagement}
        members={teamMembers}
        currentTeamId={selectedTeam.id}
      />
    </Card>
  );
};