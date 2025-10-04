import React, { useState } from 'react';
import { X, ArrowRightLeft, UserX, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { Team } from '@/types/teams';
import RemoveFromTeamDialog from './RemoveFromTeamDialog';
import TransferTeamDialog from './TransferTeamDialog';

interface ManageUserDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  } | null;
  teams: Team[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageUserDialog: React.FC<ManageUserDialogProps> = ({
  user,
  teams,
  open,
  onOpenChange
}) => {
  const { teamMembers, isLoading } = useRealTeamMembers();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (!user) return null;
  
  // Prevent rendering with stale data during refetch
  if (isLoading) return null;

  // Get user's team memberships
  const userTeamMemberships = teamMembers.filter(
    member => member.id === user.id
  );

  // Get teams where user is manager
  const managedTeams = teams.filter(team => team.manager_id === user.id);

  const handleRemoveFromTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setRemoveDialogOpen(true);
  };

  const handleTransferTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setTransferDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>
              Manage team memberships and roles for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-1">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Managed Teams */}
            {managedTeams.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Managing Teams ({managedTeams.length})
                </h4>
                <div className="space-y-2">
                  {managedTeams.map(team => (
                    <div 
                      key={team.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-muted-foreground">Team Manager</p>
                      </div>
                      <Badge variant="default">Manager</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Memberships */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Memberships ({userTeamMemberships.length})
              </h4>
              {userTeamMemberships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Not a member of any teams</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userTeamMemberships.map(membership => (
                    <div 
                      key={membership.team_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{membership.team_name}</p>
                        <Badge variant="secondary" className="mt-1">
                          {membership.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransferTeam(membership.team_id)}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Transfer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromTeam(membership.team_id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove from Team Dialog */}
      <RemoveFromTeamDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        userId={user.id}
        userName={user.name}
        teamId={selectedTeamId}
        teamName={userTeamMemberships.find(m => m.team_id === selectedTeamId)?.team_name || ''}
        onSuccess={() => {
          setRemoveDialogOpen(false);
          setSelectedTeamId(null);
          onOpenChange(false); // Close parent dialog immediately
        }}
      />

      {/* Transfer Team Dialog */}
      <TransferTeamDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        userId={user.id}
        userName={user.name}
        fromTeamId={selectedTeamId}
        teams={teams.filter(t => t.id !== selectedTeamId)}
        onSuccess={() => {
          setTransferDialogOpen(false);
          setSelectedTeamId(null);
        }}
      />
    </>
  );
};
