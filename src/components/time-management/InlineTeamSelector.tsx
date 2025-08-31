import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Team } from '@/types/teams';
import { User as AppUser } from '@/types';

interface InlineTeamSelectorProps {
  teams: Team[];
  users: AppUser[];
  selectedTeamId: string | null;
  selectedUserId: string | null;
  onTeamChange: (teamId: string | null) => void;
  onUserChange: (userId: string | null) => void;
  viewMode: 'individual' | 'team-totals';
  onViewModeChange: (mode: 'individual' | 'team-totals') => void;
  isLoading?: boolean;
}

export const InlineTeamSelector: React.FC<InlineTeamSelectorProps> = ({
  teams,
  users,
  selectedTeamId,
  selectedUserId,
  onTeamChange,
  onUserChange,
  viewMode,
  onViewModeChange,
  isLoading = false
}) => {
  const handleTeamChange = (value: string) => {
    const teamId = value === 'all' ? null : value;
    onTeamChange(teamId);
    onUserChange(null);
  };

  const handleUserChange = (value: string) => {
    const userId = value === 'all-members' ? null : value;
    onUserChange(userId);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 border-b border-border/40">
      {/* View Mode Toggle */}
      <div className="flex gap-1">
        <Badge 
          variant={viewMode === 'individual' ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => onViewModeChange('individual')}
        >
          Individual
        </Badge>
        <Badge 
          variant={viewMode === 'team-totals' ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => onViewModeChange('team-totals')}
        >
          Team Totals
        </Badge>
      </div>

      {/* Team Selection */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Select 
          value={selectedTeamId || 'all'} 
          onValueChange={handleTeamChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-48 h-8">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Selection - Only in individual view */}
      {viewMode === 'individual' && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={selectedUserId || 'all-members'} 
            onValueChange={handleUserChange}
            disabled={isLoading || !selectedTeamId}
          >
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-members">All Members</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};