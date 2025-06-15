
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
      
      // Get team member IDs first
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', teamId);

      if (membersError) throw membersError;
      
      if (!teamMembers || teamMembers.length === 0) return [];
      
      const memberIds = teamMembers.map(m => m.user_id);
      
      // Find projects where any team member is the manager or in team_members array
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', user.organizationId)
        .or(`manager_id.in.(${memberIds.join(',')}),team_members.cs.{${memberIds.join(',')}}`);

      if (projectsError) throw projectsError;
      
      return projects || [];
    },
    enabled: !!teamId && !!user?.organizationId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Team Projects ({projects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No projects assigned to this team.</p>
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
