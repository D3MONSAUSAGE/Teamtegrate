import React from 'react';
import { UnifiedTeamSelector } from '@/components/teams/UnifiedTeamSelector';

interface EnhancedTeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

/**
 * @deprecated Use StandardTeamSelector from @/components/teams instead
 * This component provides enhanced functionality but should be replaced
 */
export const EnhancedTeamSelector: React.FC<EnhancedTeamSelectorProps> = ({ 
  selectedTeamId, 
  onTeamChange 
}) => {
  return (
    <UnifiedTeamSelector
      selectedTeamId={selectedTeamId}
      onTeamChange={onTeamChange}
      variant="card"
      title="Team Filter"
    />
  );
};