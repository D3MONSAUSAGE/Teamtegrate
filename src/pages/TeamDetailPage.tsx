
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  Settings,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import TeamOverviewTab from '@/components/team/detail/tabs/TeamOverviewTab';
import TeamMembersTab from '@/components/team/detail/tabs/TeamMembersTab';
import TeamProjectsTab from '@/components/team/detail/tabs/TeamProjectsTab';
import TeamTasksTab from '@/components/team/detail/tabs/TeamTasksTab';
import TeamSettingsTab from '@/components/team/detail/tabs/TeamSettingsTab';

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
          <p className="text-muted-foreground">Comprehensive Team Management Hub</p>
        </div>
      </div>

      {/* Enhanced Tabbed Interface */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
            <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
              {teamMembers.length}
            </span>
          </TabsTrigger>
          
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            <TeamOverviewTab team={team} teamMembers={teamMembers} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <TeamMembersTab teamMembers={teamMembers} isLoading={membersLoading} />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <TeamProjectsTab teamId={teamId!} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TeamTasksTab teamId={teamId!} teamMembers={teamMembers} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <TeamSettingsTab team={team} teamMembers={teamMembers} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TeamDetailPage;
