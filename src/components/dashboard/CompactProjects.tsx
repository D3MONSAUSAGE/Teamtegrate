
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Folder, Users } from 'lucide-react';

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
    <Card className="bg-card/70 backdrop-blur-sm border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Projects
          </CardTitle>
          <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 px-3">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {displayProjects.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No projects available
          </div>
        ) : (
          displayProjects.map((project) => (
            <div key={project.id} className="bg-muted/20 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm truncate flex-1">{project.title}</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCreateTask(project)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {project.tasksCount !== undefined && (
                    <span className="text-muted-foreground">
                      {project.tasksCount} tasks
                    </span>
                  )}
                  {project.teamMemberIds && project.teamMemberIds.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{project.teamMemberIds.length}</span>
                    </div>
                  )}
                </div>
                
                {project.status && (
                  <Badge variant="outline" className="text-xs">
                    {project.status}
                  </Badge>
                )}
              </div>
              
              {/* Simple progress bar based on status */}
              <Progress 
                value={project.status === 'completed' ? 100 : project.status === 'in-progress' ? 60 : 20} 
                className="h-1 mt-2"
              />
            </div>
          ))
        )}
        
        {projects.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-xs">
              View {projects.length - 3} more projects
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactProjects;
