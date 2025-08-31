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
import { Checkbox } from '@/components/ui/checkbox';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import { TeamMemberPerformanceData } from '@/hooks/team/useRealTeamMembers';
import { Users, ArrowRight, Crown, User } from 'lucide-react';

interface BulkTeamManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TeamMemberPerformanceData[];
  currentTeamId: string;
}

export const BulkTeamManagement: React.FC<BulkTeamManagementProps> = ({
  open,
  onOpenChange,
  members,
  currentTeamId,
}) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member'>('member');
  const [isTransferring, setIsTransferring] = useState(false);

  const { userTeams } = useTeamContext();
  const { bulkTransferMembers } = useTeamMemberOperations();

  // Filter out current team from available teams
  const availableTeams = userTeams.filter(team => team.id !== currentTeamId);

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(prev => [...prev, memberId]);
    } else {
      setSelectedMemberIds(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(members.map(m => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleBulkTransfer = async () => {
    if (!selectedMemberIds.length || !selectedTeamId) return;

    setIsTransferring(true);
    try {
      await bulkTransferMembers(currentTeamId, selectedTeamId, selectedMemberIds, selectedRole);
      onOpenChange(false);
      setSelectedMemberIds([]);
      setSelectedTeamId('');
      setSelectedRole('member');
    } catch (error) {
      console.error('Bulk transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedMemberIds([]);
    setSelectedTeamId('');
    setSelectedRole('member');
  };

  const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
  const totalTasksToTransfer = selectedMembers.reduce((sum, member) => sum + member.totalTasks, 0);
  const selectedTeam = availableTeams.find(team => team.id === selectedTeamId);
  const currentTeam = userTeams.find(team => team.id === currentTeamId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Team Management</DialogTitle>
          <DialogDescription>
            Transfer multiple team members to another team at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Member Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Select Members ({selectedMemberIds.length} of {members.length})
              </label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all"
                  checked={selectedMemberIds.length === members.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Select All
                </label>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50">
                  <Checkbox
                    checked={selectedMemberIds.includes(member.id)}
                    onCheckedChange={(checked) => handleMemberToggle(member.id, checked as boolean)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.name}</p>
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
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {member.totalTasks} tasks
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedMemberIds.length > 0 && (
            <>
              {/* Transfer Path */}
              <div className="flex items-center gap-3 text-sm bg-muted/50 p-3 rounded-lg">
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

              {/* Transfer Configuration */}
              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    New Role for All
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
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Impact:</strong> {selectedMemberIds.length} members and {totalTasksToTransfer} tasks will be transferred
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkTransfer}
            disabled={!selectedMemberIds.length || !selectedTeamId || isTransferring}
          >
            {isTransferring ? 'Transferring...' : `Transfer ${selectedMemberIds.length} Members`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};