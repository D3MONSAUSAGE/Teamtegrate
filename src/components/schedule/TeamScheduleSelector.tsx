import React from 'react';
import { InlineTeamSelector } from '@/components/teams';
import { Team } from '@/types/teams';

interface TeamScheduleSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  disabled?: boolean;
  showAllOption?: boolean;
}

/**
 * @deprecated Use InlineTeamSelector from @/components/teams instead
 * This component uses the unified team management system
 */
export const TeamScheduleSelector: React.FC<TeamScheduleSelectorProps> = ({
  teams,
  selectedTeamId,
  onTeamChange,
  disabled = false,
  showAllOption = true,
}) => {
  return (
    <InlineTeamSelector
      selectedTeamId={selectedTeamId}
      onTeamChange={onTeamChange}
      showAllOption={showAllOption}
      disabled={disabled}
      placeholder="Select team"
    />
  );
};