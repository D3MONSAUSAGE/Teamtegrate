import React from 'react';
import { ProfessionalLabelGenerator } from './ProfessionalLabelGenerator';

interface CleanLabelSystemProps {
  selectedTeamId: string | null;
}

/**
 * Legacy CleanLabelSystem component - now redirects to ProfessionalLabelGenerator
 * This maintains backward compatibility while using the new professional system
 */
export const CleanLabelSystem: React.FC<CleanLabelSystemProps> = ({ selectedTeamId }) => {
  return <ProfessionalLabelGenerator selectedTeamId={selectedTeamId} />;
};