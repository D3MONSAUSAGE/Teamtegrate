import React from 'react';
import { UnifiedTeamSelector, UnifiedTeamSelectorProps } from './UnifiedTeamSelector';

/**
 * Standard team selector component - use this instead of the old TeamSelector
 * Provides consistent interface and behavior across the application
 */
export const StandardTeamSelector: React.FC<UnifiedTeamSelectorProps> = (props) => {
  return <UnifiedTeamSelector {...props} />;
};

// Export commonly used configurations
export const SimpleTeamSelector: React.FC<UnifiedTeamSelectorProps> = (props) => (
  <UnifiedTeamSelector variant="simple" {...props} />
);

export const InlineTeamSelector: React.FC<UnifiedTeamSelectorProps> = (props) => (
  <UnifiedTeamSelector variant="inline" {...props} />
);

export const CardTeamSelector: React.FC<UnifiedTeamSelectorProps> = (props) => (
  <UnifiedTeamSelector variant="card" {...props} />
);