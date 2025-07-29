import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useProjectTeamMembers } from '@/hooks/useProjectTeamMembers';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { Project, User } from '@/types';
import { ChevronDown, ChevronUp, Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface ProjectTeamPerformanceViewProps {
  projects: Project[];
}

interface TeamMemberPerformance {
  user: User;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const ProjectTeamCard: React.FC<{ 
  project: Project; 
  isExpanded: boolean; 
  onToggle: () => void;
}> = ({ project, isExpanded, onToggle }) => {
  const { teamMembers, isLoading: teamLoading } = useProjectTeamMembers(project.id);
  const { tasks, isLoading: tasksLoading } = useProjectTasks(project.id);

  const teamPerformance: TeamMemberPerformance[] = React.useMemo(() => {
    if (!teamMembers || !tasks) return [];

    return teamMembers.map(member => {
      const memberTasks = tasks.filter(task => 
        task.assignedToId === member.id || 
        task.assignedToIds?.includes(member.id) ||
        task.userId === member.id
      );
      
      const completedTasks = memberTasks.filter(task => task.status === 'Completed').length;
      const overdueTasks = memberTasks.filter(task => 
        task.status !== 'Completed' && 
        task.deadline && 
        new Date(task.deadline) < new Date()
      ).length;
      
      const completionRate = memberTasks.length > 0 ? (completedTasks / memberTasks.length) * 100 : 0;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (overdueTasks > 2 || completionRate < 50) riskLevel = 'high';
      else if (overdueTasks > 0 || completionRate < 75) riskLevel = 'medium';

      return {
        user: member,
        totalTasks: memberTasks.length,
        completedTasks,
        overdueTasks,
        completionRate,
        riskLevel
      };
    });
  }, [teamMembers, tasks]);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getRiskBadgeVariant = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users size={16} />
              <span>{teamMembers?.length || 0} members</span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {teamLoading || tasksLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading team performance...</div>
          ) : teamPerformance.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No team members assigned</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamPerformance.map(member => (
                  <Card key={member.user.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">{member.user.role}</p>
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeVariant(member.riskLevel)} className="text-xs">
                        {member.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span className={getRiskColor(member.riskLevel)}>
                          {member.completionRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={member.completionRate} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground">
                            <Clock size={12} />
                            <span>{member.totalTasks}</span>
                          </div>
                          <p className="text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <CheckCircle size={12} />
                            <span>{member.completedTasks}</span>
                          </div>
                          <p className="text-muted-foreground">Done</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-destructive">
                            <AlertTriangle size={12} />
                            <span>{member.overdueTasks}</span>
                          </div>
                          <p className="text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const ProjectTeamPerformanceView: React.FC<ProjectTeamPerformanceViewProps> = ({ projects }) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    setExpandedProjects(new Set(projects.map(p => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedProjects(new Set());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team Performance
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExpandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects found
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <ProjectTeamCard
                key={project.id}
                project={project}
                isExpanded={expandedProjects.has(project.id)}
                onToggle={() => toggleProject(project.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};