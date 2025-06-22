
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamSelectProps {
  teams: Team[];
  isLoading: boolean;
  selectedTeam?: string;
  onTeamChange: (teamId: string) => void;
  disabled?: boolean;
  optional?: boolean;
}

const TeamSelect: React.FC<TeamSelectProps> = ({
  teams,
  isLoading,
  selectedTeam,
  onTeamChange,
  disabled = false,
  optional = false,
}) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Select Team {optional && <span className="text-muted-foreground">(Optional)</span>}
      </Label>
      <Select 
        value={selectedTeam || ""} 
        onValueChange={onTeamChange}
        disabled={isLoading || disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            isLoading ? "Loading teams..." : 
            disabled ? "Select organization first" :
            optional ? "All teams (or select specific team)" :
            "Choose a team"
          } />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <>
              {optional && (
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    All Teams
                  </div>
                </SelectItem>
              )}
              {teams.length === 0 ? (
                <div className="text-center p-2 text-muted-foreground">
                  No teams found
                </div>
              ) : (
                teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex flex-col">
                      <span>{team.name}</span>
                      {team.description && (
                        <span className="text-xs text-muted-foreground">{team.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamSelect;
