import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Users, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserManagerDisplayProps {
  userId: string;
  userName: string;
}

interface TeamWithManager {
  team_id: string;
  team_name: string;
  manager_id: string | null;
  manager_name: string | null;
  manager_email: string | null;
}

export const UserManagerDisplay: React.FC<UserManagerDisplayProps> = ({ userId, userName }) => {
  const { data: teamManagers, isLoading } = useQuery({
    queryKey: ['user-team-managers', userId],
    queryFn: async (): Promise<TeamWithManager[]> => {
      // Get user's team memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('team_memberships')
        .select(`
          team_id,
          teams!inner (
            id,
            name,
            manager_id,
            manager:users!teams_manager_id_fkey (
              id,
              name,
              email
            )
          )
        `)
        .eq('user_id', userId);

      if (membershipError) throw membershipError;

      // Transform the data
      const teamsWithManagers = memberships?.map((membership: any) => {
        const team = membership.teams;
        const manager = team?.manager;
        
        return {
          team_id: team?.id || '',
          team_name: team?.name || '',
          manager_id: manager?.id || null,
          manager_name: manager?.name || null,
          manager_email: manager?.email || null,
        };
      }) || [];

      return teamsWithManagers;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Manager Information
          </CardTitle>
          <CardDescription>Displays managers from team assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teamManagers || teamManagers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Manager Information
          </CardTitle>
          <CardDescription>Displays managers from team assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userName} is not assigned to any team. Assign them to a team to establish a manager relationship.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Manager Information
        </CardTitle>
        <CardDescription>
          Managers are automatically assigned based on team membership
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamManagers.map((teamManager) => (
            <div key={teamManager.team_id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{teamManager.team_name}</span>
                </div>
                {teamManager.manager_id ? (
                  teamManager.manager_id === userId ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span>{userName} is the manager of this team</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{teamManager.manager_name}</span>
                        <Badge variant="outline" className="text-xs">
                          Team Manager
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {teamManager.manager_email}
                      </p>
                    </div>
                  )
                ) : (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      This team does not have a manager assigned
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ))}
        </div>

        {teamManagers.length > 1 && (
          <p className="text-xs text-muted-foreground mt-4">
            This employee is part of multiple teams and reports to multiple managers
          </p>
        )}
      </CardContent>
    </Card>
  );
};
