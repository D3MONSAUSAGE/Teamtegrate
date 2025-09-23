import React from 'react';
import { SimpleTeamSelector } from '@/components/teams';
import { useTeamContext } from '@/hooks/useTeamContext';

interface TeamSelectorProps {
  showAllOption?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * @deprecated Use StandardTeamSelector from @/components/teams instead
 * This component is kept for backward compatibility but will be removed
 */
export const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  showAllOption = true, 
  placeholder = "Select team...",
  className 
}) => {
  const teamContext = useTeamContext();

  if (!teamContext) {
    return <div className={className}>Loading teams...</div>;
  }

  const { selectedTeam, setSelectedTeam } = teamContext;

  const handleTeamChange = (teamId: string | null) => {
    if (teamId === null) {
      setSelectedTeam(null);
    } else {
      const team = teamContext.userTeams.find(t => t.id === teamId);
      setSelectedTeam(team || null);
    }
  };

  return (
    <SimpleTeamSelector
      selectedTeamId={selectedTeam?.id || null}
      onTeamChange={handleTeamChange}
      showAllOption={showAllOption}
      placeholder={placeholder}
      className={className}
    />
  );
};