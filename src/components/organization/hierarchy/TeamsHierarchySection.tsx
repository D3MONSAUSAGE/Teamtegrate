import React, { useState } from 'react';
import { Users, ChevronDown, ChevronRight, Plus, Settings, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TeamHierarchyCard } from './TeamHierarchyCard';
import { Team } from '@/types/teams';

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface TeamsHierarchySectionProps {
  teams: Team[];
  allUsers: OrganizationUser[];
  searchTerm: string;
  onCreateTeam?: () => void;
  canCreateTeams?: boolean;
}

export const TeamsHierarchySection: React.FC<TeamsHierarchySectionProps> = ({ 
  teams, 
  allUsers, 
  searchTerm,
  onCreateTeam,
  canCreateTeams = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => {
    if (!searchTerm) return true;
    return team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (filteredTeams.length === 0 && searchTerm) {
    return null; // Don't show empty section when searching
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <CardTitle className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 transition-transform" />
                ) : (
                  <ChevronRight className="h-5 w-5 transition-transform" />
                )}
                <Users className="h-5 w-5 text-blue-500" />
                Teams Structure
                <Badge variant="secondary" className="ml-2">
                  {filteredTeams.length} Teams
                </Badge>
              </CardTitle>
              {canCreateTeams && onCreateTeam && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={onCreateTeam}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No teams found</p>
                {canCreateTeams && onCreateTeam && (
                  <Button variant="outline" className="mt-4" onClick={onCreateTeam}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Team
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTeams.map(team => (
                  <TeamHierarchyCard 
                    key={team.id} 
                    team={team}
                    allUsers={allUsers}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};