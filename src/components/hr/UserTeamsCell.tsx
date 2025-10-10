import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface UserTeamsCellProps {
  userId: string;
}

interface TeamMembership {
  team_id: string;
  teams: {
    id: string;
    name: string;
  };
}

const UserTeamsCell: React.FC<UserTeamsCellProps> = ({ userId }) => {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['user-teams', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_memberships')
        .select('team_id, teams:teams(id, name)')
        .eq('user_id', userId);

      if (error) throw error;
      return (data as unknown as TeamMembership[]) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (teams.length === 0) {
    return <span className="text-sm text-muted-foreground">No teams assigned</span>;
  }

  const visibleTeams = teams.slice(0, 2);
  const remainingCount = teams.length - 2;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTeams.map((membership) => (
        <Badge key={membership.team_id} variant="secondary" className="text-xs">
          {membership.teams.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};

export default UserTeamsCell;
