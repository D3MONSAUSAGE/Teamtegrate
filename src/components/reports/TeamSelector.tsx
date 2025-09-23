import React from 'react';
import { CardTeamSelector } from '@/components/teams';
import { useTeamAccess } from '@/hooks/useTeamAccess';

interface TeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

/**
 * @deprecated Use CardTeamSelector from @/components/teams instead
 * This component uses the unified team management system
 */
export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeamId,
  onTeamChange
}) => {
  return (
    <CardTeamSelector
      selectedTeamId={selectedTeamId}
      onTeamChange={onTeamChange}
      title="Team Analytics"
    />
  );
};