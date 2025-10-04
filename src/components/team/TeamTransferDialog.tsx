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
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
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
  const [memberTeamIds, setMemberTeamIds] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  // Try to get teams from context first, fallback to direct hook
  let userTeams: any[] = [];
  let contextError = false;
  
  try {
    const context = useTeamContext();
    userTeams = context.userTeams;
  } catch (error) {
    contextError = true;
  }
  
  // Fallback to direct teams hook if context is not available
  const { teams: fallbackTeams } = useTeamAccess();
  if (contextError && fallbackTeams) {
    userTeams = fallbackTeams;
  }
  
  const { transferTeamMember } = useTeamMemberOperations();

  React.useEffect(() => {
    const loadMemberships = async () => {
      if (!member?.id) { setMemberTeamIds([]); return; }
      try {
        setLoadingTeams(true);
        const { data, error } = await supabase
          .from('team_memberships')
          .select('team_id')
          .eq('user_id', member.id);
        if (error) throw error;
        setMemberTeamIds((data || []).map((d: any) => d.team_id));
      } catch (err) {
        console.error('Failed to fetch member team memberships', err);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadMemberships();
  }, [member?.id, open]);

  // Filter out current team and teams the member already belongs to
  const availableTeams = userTeams.filter(team => team.id !== currentTeamId && !memberTeamIds.includes(team.id));
  const handleTransfer = async () => {
    if (!member || !selectedTeamId) return;

    setIsTransferring(true);
    try {
      await transferTeamMember(currentTeamId, selectedTeamId, member.id, selectedRole);
      toast.success(`${member.name} has been transferred successfully`);
      onOpenChange(false);
      setSelectedTeamId('');
      setSelectedRole('member');
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Failed to transfer team member. Please try again.');
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
                {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
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
                  {loadingTeams ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading teams…</div>
                  ) : availableTeams.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      This member already belongs to all other teams.
                    </div>
                  ) : (
                    availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{team.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {team.member_count} members
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
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
            disabled={!selectedTeamId || isTransferring || availableTeams.length === 0}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};