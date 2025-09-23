/**
 * @deprecated Use StandardTeamSelector from @/components/teams instead
 * This component is kept for backward compatibility but will be removed
 * 
 * Migration:
 * - Replace TeamSelect with StandardTeamSelector from @/components/teams
 * - Use selectedTeamId/onTeamChange props instead of selectedTeam/onTeamChange
 * - New component provides better role-based filtering and consistent interface
 */
import React from 'react';
import { StandardTeamSelector } from '@/components/teams';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamSelectProps {
  teams: Team[] | undefined;
  isLoading: boolean;
  selectedTeam?: string;
  onTeamChange: (teamId: string | undefined) => void;
  disabled?: boolean;
  optional?: boolean;
}

const TeamSelect: React.FC<TeamSelectProps> = ({
  teams = [],
  isLoading,
  selectedTeam,
  onTeamChange,
  disabled = false,
  optional = false,
}) => {
  const handleTeamChange = (teamId: string | null) => {
    onTeamChange(teamId || undefined);
  };

  return (
    <div className="space-y-3">
      <StandardTeamSelector
        selectedTeamId={selectedTeam || null}
        onTeamChange={handleTeamChange}
        disabled={disabled || isLoading}
        showAllOption={optional}
        placeholder={
          isLoading ? "Loading teams..." :
          disabled ? "Select organization first" :
          optional ? "Select team (optional)" :
          "Select a team to continue"
        }
      />
    </div>
  );
};

export { TeamSelect };