import React from 'react';
import { ProfessionalLabelGenerator } from './ProfessionalLabelGenerator';

/**
 * Legacy CleanLabelSystem component - now redirects to ProfessionalLabelGenerator
 * This maintains backward compatibility while using the new professional system
 */
export const CleanLabelSystem: React.FC = () => {
  return <ProfessionalLabelGenerator />;
};