import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { TeamMemberPerformanceData } from '@/hooks/team/useRealTeamMembers';
import { Users, ArrowRight } from 'lucide-react';

interface TeamTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMemberPerformanceData | null;
  currentTeamId: string;
}

export const TeamTransferDialog: React.FC<TeamTransferDialogProps> = ({
  open,
  onOpenChange,
  member,
  currentTeamId,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member'>('member');
  const [isTransferring, setIsTransferring] = useState(false);

  const { userTeams } = useTeamContext();
  const { transferTeamMember } = useTeamMemberOperations();

  // Filter out current team from available teams
  const availableTeams = userTeams.filter(team => team.id !== currentTeamId);

  const handleTransfer = async () => {
    if (!member || !selectedTeamId) return;

    setIsTransferring(true);
    try {
      await transferTeamMember(currentTeamId, selectedTeamId, member.id, selectedRole);
      onOpenChange(false);
      setSelectedTeamId('');
      setSelectedRole('member');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedTeamId('');
    setSelectedRole('member');
  };

  if (!member) return null;

  const selectedTeam = availableTeams.find(team => team.id === selectedTeamId);
  const currentTeam = userTeams.find(team => team.id === currentTeamId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Team Member</DialogTitle>
          <DialogDescription>
            Move {member.name} from one team to another. This will also transfer their assigned tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback>
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
            <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
              {member.role}
            </Badge>
          </div>

          {/* Transfer Path */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentTeam?.name || 'Current Team'}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {selectedTeam?.name || 'Select Team'}
              </span>
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Transfer to Team
              </label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination team" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{team.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {team.member_count} members
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                New Role
              </label>
              <Select value={selectedRole} onValueChange={(value: 'manager' | 'member') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Impact Summary */}
          {member.totalTasks > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Impact:</strong> {member.totalTasks} tasks will be transferred to the new team
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedTeamId || isTransferring}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};