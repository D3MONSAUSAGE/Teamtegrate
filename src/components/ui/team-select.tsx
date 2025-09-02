
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
  teams = [], // Safe default
  isLoading,
  selectedTeam,
  onTeamChange,
  disabled = false,
  optional = false,
}) => {
  // Ensure teams is always an array
  const safeTeams = Array.isArray(teams) ? teams : [];

  console.log('TeamSelect: Rendering with', {
    teamsCount: safeTeams.length,
    isLoading,
    selectedTeam,
    disabled
  });

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-3 w-3 text-primary" />
        </div>
        Team Selection {optional && <span className="text-xs text-muted-foreground/70">(Optional)</span>}
      </Label>
      <Select 
        value={selectedTeam || ""} 
        onValueChange={onTeamChange}
        disabled={isLoading || disabled}
      >
        <SelectTrigger className="h-11 bg-gradient-to-r from-background to-muted/20 border-border/50 hover:border-primary/30 transition-all duration-200">
          <SelectValue placeholder={
            isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading teams...
              </div>
            ) : 
            disabled ? "Select organization first" :
            optional ? "All teams (or select specific team)" :
            "Choose a team"
          } />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin mr-3 text-primary" />
              <span className="text-sm text-muted-foreground">Loading teams...</span>
            </div>
          ) : (
            <>
              {optional && (
                <SelectItem value="all" className="focus:bg-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">All Teams</span>
                      <p className="text-xs text-muted-foreground">View all team documents</p>
                    </div>
                  </div>
                </SelectItem>
              )}
              {safeTeams.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No teams found</p>
                </div>
              ) : (
                safeTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id} className="focus:bg-primary/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{team.name}</span>
                        {team.description && (
                          <span className="text-xs text-muted-foreground">{team.description}</span>
                        )}
                      </div>
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
