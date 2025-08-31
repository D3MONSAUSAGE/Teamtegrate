import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Crown } from 'lucide-react';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useAuth } from '@/contexts/AuthContext';

interface TeamSelectorProps {
  showAllOption?: boolean;
  placeholder?: string;
  className?: string;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({ 
  showAllOption = true, 
  placeholder = "Select team...",
  className 
}) => {
  const { selectedTeam, setSelectedTeam, userTeams } = useTeamContext();
  const { user } = useAuth();

  const handleTeamChange = (value: string) => {
    if (value === 'all') {
      setSelectedTeam(null);
    } else {
      const team = userTeams.find(t => t.id === value);
      setSelectedTeam(team || null);
    }
  };

  return (
    <div className={className}>
      <Select 
        value={selectedTeam?.id || 'all'} 
        onValueChange={handleTeamChange}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Teams
              </div>
            </SelectItem>
          )}
          {userTeams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-2 flex-1">
                  <Users className="h-4 w-4" />
                  <span>{team.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {team.manager_id === user?.id && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Manager
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {team.member_count} members
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};