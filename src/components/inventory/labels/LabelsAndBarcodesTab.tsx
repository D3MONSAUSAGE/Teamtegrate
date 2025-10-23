import React from 'react';
import { CleanLabelSystem } from './CleanLabelSystem';

interface LabelsAndBarcodesTabProps {
  selectedTeamId: string | null;
}

export const LabelsAndBarcodesTab: React.FC<LabelsAndBarcodesTabProps> = ({ selectedTeamId }) => {
  return <CleanLabelSystem selectedTeamId={selectedTeamId} />;
};