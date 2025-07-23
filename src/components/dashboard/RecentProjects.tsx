
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { Plus, Folder, Calendar, Users, TrendingUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateProjectColor } from '@/utils/colorUtils';

interface RecentProjectsProps {
  projects: Project[];
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects }) => {
  const recentProjects = projects.slice(0, 6);

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'from-green-500 to-emerald-600';
      case 'in_progress': return 'from-amber-500 to-orange-600';
      case 'planning': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🚀';
      case 'planning': return '📋';
      default: return '📁';
    }
  };

  const ProjectCard = ({ project, index }: { project: Project; index: number }) => (
    <div
      key={project.id}
      className={cn(
        "group p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md animate-fade-in",
        "bg-card/80 hover:bg-card border-border/50 hover:border-primary/30 hover:scale-[1.02]"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-gradient-to-r text-white shadow-sm",
          getProjectStatusColor(project.status)
        )}>
          <span className="text-lg">{getProjectStatusIcon(project.status)}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm truncate text-foreground">
              {project.title}
            </h3>
            <Badge
              variant="secondary"
              className="text-xs bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border-primary/20"
            >
              {project.status?.replace('_', ' ')}
            </Badge>
          </div>
          
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {project.startDate 
                  ? format(new Date(project.startDate), 'MMM dd')
                  : 'No date'
                }
              </span>
            </div>
            {project.budget && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>${project.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card/50 via-card/80 to-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">
                Recent Projects
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your active work</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:from-emerald-500/20 hover:to-teal-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Folder className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first project to organize your work</p>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentProjects;
