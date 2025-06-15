
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Calendar, DollarSign, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface TeamProjectsViewProps {
  teamId: string;
}

const TeamProjectsView: React.FC<TeamProjectsViewProps> = ({ teamId }) => {
  const { user } = useAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['team-projects', teamId, user?.organizationId],
    queryFn: async () => {
      if (!teamId || !user?.organizationId) return [];
      
      console.log('TeamProjectsView: Fetching projects for team with STRICT RLS:', {
        teamId,
        currentUserId: user.id,
        userRole: user.role,
        organizationId: user.organizationId
      });
      
      // Get team member IDs first
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', teamId);

      if (membersError) {
        console.error('TeamProjectsView: Error fetching team members:', membersError);
        throw membersError;
      }
      
      if (!teamMembers || teamMembers.length === 0) {
        console.log('TeamProjectsView: No team members found');
        return [];
      }
      
      const memberIds = teamMembers.map(m => m.user_id);
      console.log('TeamProjectsView: Found team members:', memberIds.length);
      
      // Find projects using STRICT RLS - will only return projects current user can access
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .or(`manager_id.in.(${memberIds.join(',')}),team_members.cs.{${memberIds.join(',')}}`);

      if (projectsError) {
        console.error('TeamProjectsView: Error fetching projects with strict RLS:', projectsError);
        throw projectsError;
      }
      
      console.log('TeamProjectsView: STRICT RLS returned projects:', {
        totalProjects: projects?.length || 0,
        teamMemberCount: memberIds.length,
        note: 'Only projects current user can access are returned'
      });
      
      return projects || [];
    },
    enabled: !!teamId && !!user?.organizationId,
    staleTime: 30000, // Cache for 30 seconds for better performance
    retry: (failureCount, error) => {
      console.error('TeamProjectsView: Query retry attempt:', failureCount, error?.message);
      return failureCount < 2;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Team Projects ({projects.length}) - Strict Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No accessible projects for this team.</p>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{project.title}</h4>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={
                    project.status === 'Completed' ? 'default' :
                    project.status === 'In Progress' ? 'secondary' : 'outline'
                  }>
                    {project.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(project.end_date || project.updated_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {project.budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Budget: ${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{project.team_members?.length || 0} members</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span>Tasks: {project.tasks_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamProjectsView;
