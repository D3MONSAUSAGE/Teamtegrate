
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Edit3, 
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from '@/types';

interface ProjectActionToolbarProps {
  project: Project;
  onEditProject: () => void;
  onManageTeam: () => void;
  viewMode: 'compact' | 'detailed' | 'board' | 'list';
  onViewModeChange: (mode: 'compact' | 'detailed' | 'board' | 'list') => void;
}

const ProjectActionToolbar: React.FC<ProjectActionToolbarProps> = ({
  project,
  onEditProject,
  onManageTeam,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
            {project.tags && project.tags.length > 0 && (
              <div className="flex gap-1">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Edit Project */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEditProject}
          className="gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Edit Project
        </Button>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Archive Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProjectActionToolbar;
