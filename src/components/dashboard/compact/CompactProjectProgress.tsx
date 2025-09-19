import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  ChevronRight, 
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Project, Task } from '@/types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface CompactProjectProgressProps {
  projects: Project[];
  tasks: Task[];
  onCreateProject?: () => void;
}

const CompactProjectProgress: React.FC<CompactProjectProgressProps> = ({
  projects,
  tasks,
  onCreateProject
}) => {
  // Calculate project progress based on associated tasks
  const getProjectProgress = (project: Project) => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'Completed');
    const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;
    
    return {
      progress: Math.round(progress),
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: projectTasks.length - completedTasks.length
    };
  };

  const getProjectStatus = (project: Project) => {
    if (project.isCompleted) {
      return { text: 'Completed', color: 'text-green-600 bg-green-50 dark:bg-green-950/20', icon: CheckCircle };
    }
    
    const endDate = new Date(project.endDate);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) {
      return { text: 'Overdue', color: 'text-red-600 bg-red-50 dark:bg-red-950/20', icon: AlertTriangle };
    } else if (daysUntilDeadline <= 7) {
      return { text: 'Due Soon', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20', icon: Clock };
    } else {
      return { text: 'Active', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20', icon: Clock };
    }
  };

  const activeProjects = projects.filter(p => !p.isCompleted).slice(0, 4);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Project Progress
          </span>
          {onCreateProject && (
            <Button
              onClick={onCreateProject}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeProjects.length > 0 ? (
          <>
            {activeProjects.map((project) => {
              const progressInfo = getProjectProgress(project);
              const status = getProjectStatus(project);
              const StatusIcon = status.icon;
              
              return (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {project.title}
                        </h4>
                        <Badge variant="outline" className={`text-xs px-1 py-0 ${status.color}`}>
                          <StatusIcon className="h-2.5 w-2.5 mr-1" />
                          {status.text}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {progressInfo.completedTasks}/{progressInfo.totalTasks} tasks • Due {format(new Date(project.endDate), 'MMM d')}
                      </div>
                    </div>
                    <Link to={`/dashboard/projects/${project.id}/tasks`}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={progressInfo.progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progressInfo.progress}% complete</span>
                      <span>{progressInfo.pendingTasks} remaining</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {projects.length > 4 && (
              <Link to="/dashboard/projects">
                <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                  View all {projects.length} projects
                </Button>
              </Link>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active projects</p>
            {onCreateProject && (
              <Button
                onClick={onCreateProject}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactProjectProgress;