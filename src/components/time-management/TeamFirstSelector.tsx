import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Team } from '@/types/teams';
import { User as AppUser } from '@/types';

interface TeamFirstSelectorProps {
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

export const TeamFirstSelector: React.FC<TeamFirstSelectorProps> = ({
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
  // Filter users by selected team
  const filteredUsers = selectedTeamId === 'all' 
    ? users 
    : users.filter(user => {
        // This would need team membership data - for now show all users
        return true;
      });

  const handleTeamChange = (value: string) => {
    const teamId = value === 'all' ? null : value;
    onTeamChange(teamId);
    // Reset user selection when team changes
    onUserChange(null);
  };

  const handleUserChange = (value: string) => {
    onUserChange(value);
  };

  return (
    <Card className="p-4 border-l-4 border-l-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Navigation Controls</h3>
          <div className="flex gap-2">
            <Badge 
              variant={viewMode === 'individual' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onViewModeChange('individual')}
            >
              Individual View
            </Badge>
            <Badge 
              variant={viewMode === 'team-totals' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onViewModeChange('team-totals')}
            >
              Team Totals
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Team
            </label>
            <Select 
              value={selectedTeamId || 'all'} 
              onValueChange={handleTeamChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose team..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.member_count} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Selection - Only show in individual view */}
          {viewMode === 'individual' && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Employee
              </label>
              <Select 
                value={selectedUserId || ''} 
                onValueChange={handleUserChange}
                disabled={isLoading || !selectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedTeamId ? "Select team first..." : "Choose employee..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Selection Summary */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {selectedTeamId && (
            <Badge variant="secondary">
              Team: {teams.find(t => t.id === selectedTeamId)?.name || 'All Teams'}
            </Badge>
          )}
          {selectedUserId && viewMode === 'individual' && (
            <Badge variant="secondary">
              Employee: {users.find(u => u.id === selectedUserId)?.name || 'Unknown'}
            </Badge>
          )}
          <Badge variant="outline">
            View: {viewMode === 'individual' ? 'Individual' : 'Team Totals'}
          </Badge>
        </div>
      </div>
    </Card>
  );
};