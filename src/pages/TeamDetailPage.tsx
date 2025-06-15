
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  Crown,
  User,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import TeamMemberTasksView from '@/components/team/detail/TeamMemberTasksView';
import TeamProjectsView from '@/components/team/detail/TeamProjectsView';

const TeamDetailPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch team details
  const { data: team, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: ['team-detail', teamId, user?.organizationId],
    queryFn: async () => {
      if (!teamId || !user?.organizationId) return null;
      
      const { data, error } = await supabase
        .from('team_details')
        .select('*')
        .eq('id', teamId)
        .eq('organization_id', user.organizationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!teamId && !!user?.organizationId,
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId, user?.organizationId],
    queryFn: async () => {
      if (!teamId || !user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          users!inner(
            id,
            name,
            email,
            role
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId && !!user?.organizationId,
  });

  if (teamLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {teamError?.message || 'Team not found or you do not have permission to view it.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard/organization')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organization
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {team.name}
          </h1>
          <p className="text-muted-foreground">Team Details & Management</p>
        </div>
      </div>

      {/* Team Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {team.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{team.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Members</p>
              <p className="text-2xl font-bold text-primary">{team.member_count}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Manager</p>
              <div className="flex items-center gap-1">
                {team.manager_name ? (
                  <>
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm">{team.manager_name}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No manager</span>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <Badge variant={team.is_active ? "default" : "secondary"}>
                {team.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Created</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="text-sm">{format(new Date(team.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No team members found.</p>
          ) : (
            <div className="grid gap-3">
              {teamMembers.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{membership.users.name || membership.users.email}</p>
                      <p className="text-sm text-muted-foreground">{membership.users.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{membership.users.role}</Badge>
                    <Badge variant={membership.role === 'manager' ? 'default' : 'secondary'}>
                      {membership.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Projects */}
      <TeamProjectsView teamId={teamId!} />

      {/* Team Member Tasks */}
      <TeamMemberTasksView teamId={teamId!} teamMembers={teamMembers} />
    </div>
  );
};

export default TeamDetailPage;
