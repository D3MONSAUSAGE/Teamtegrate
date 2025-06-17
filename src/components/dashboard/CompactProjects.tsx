
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Folder, Users, RefreshCw } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  tasksCount?: number;
  teamMemberIds?: string[];
  status?: string;
}

interface CompactProjectsProps {
  projects: Project[];
  onCreateTask: (project: Project) => void;
  onRefresh: () => void;
}

const CompactProjects: React.FC<CompactProjectsProps> = ({
  projects,
  onCreateTask,
  onRefresh
}) => {
  const displayProjects = projects.slice(0, 3);

  return (
    <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Active Projects
          </CardTitle>
          <Button size="sm" variant="outline" onClick={onRefresh} className="h-9 px-3">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {displayProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-base">No projects available</p>
            <p className="text-sm">Start by creating your first project</p>
          </div>
        ) : (
          displayProjects.map((project) => (
            <div key={project.id} className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-base text-foreground truncate flex-1 pr-3">
                  {project.title}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCreateTask(project)}
                  className="h-8 w-8 p-0 shrink-0"
                  title="Add Task"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-4">
                  {project.tasksCount !== undefined && (
                    <span className="text-muted-foreground font-medium">
                      {project.tasksCount} tasks
                    </span>
                  )}
                  {project.teamMemberIds && project.teamMemberIds.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{project.teamMemberIds.length} members</span>
                    </div>
                  )}
                </div>
                
                {project.status && (
                  <Badge variant="outline" className="text-xs">
                    {project.status}
                  </Badge>
                )}
              </div>
              
              {/* Progress bar based on status */}
              <Progress 
                value={project.status === 'completed' ? 100 : project.status === 'in-progress' ? 60 : 20} 
                className="h-2"
              />
            </div>
          ))
        )}
        
        {projects.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
              View {projects.length - 3} more projects
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactProjects;
