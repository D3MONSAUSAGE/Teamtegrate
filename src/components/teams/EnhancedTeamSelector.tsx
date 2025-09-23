import React from 'react';
import { StandardTeamSelector } from './StandardTeamSelector';
import type { UnifiedTeamSelectorProps } from './UnifiedTeamSelector';

interface EnhancedTeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

/**
 * Enhanced Team Selector with better role handling and auto-selection logic
 * Uses the unified team management system under the hood
 */
export const EnhancedTeamSelector: React.FC<EnhancedTeamSelectorProps> = ({ 
  selectedTeamId, 
  onTeamChange 
}) => {
  return (
    <StandardTeamSelector
      selectedTeamId={selectedTeamId}
      onTeamChange={onTeamChange}
      variant="card"
      title="Team Filter"
    />
  );
};