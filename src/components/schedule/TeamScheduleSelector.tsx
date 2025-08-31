import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { Team } from '@/types/teams';

interface TeamScheduleSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  disabled?: boolean;
  showAllOption?: boolean;
}

export const TeamScheduleSelector: React.FC<TeamScheduleSelectorProps> = ({
  teams,
  selectedTeamId,
  onTeamChange,
  disabled = false,
  showAllOption = true,
}) => {
  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onTeamChange(null);
    } else {
      onTeamChange(value);
    }
  };

  const displayValue = selectedTeamId || 'all';

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select value={displayValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Teams</SelectItem>
          )}
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};