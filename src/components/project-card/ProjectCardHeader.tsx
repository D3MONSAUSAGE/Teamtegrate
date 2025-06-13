
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from '@/types';

interface ProjectCardHeaderProps {
  project: Project;
  onDeleteClick: () => void;
  onEditClick: () => void;
  isDeleting: boolean;
}

const ProjectCardHeader: React.FC<ProjectCardHeaderProps> = ({
  project,
  onDeleteClick,
  onEditClick,
  isDeleting
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit menu item clicked');
    onEditClick();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteClick();
  };

  return (
    <div className="p-6 pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <h3 className="text-xl font-semibold text-card-foreground line-clamp-2 leading-tight">
            {project.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium ${getStatusColor(project.status)}`}
            >
              {project.status}
            </Badge>
            {project.isCompleted && (
              <Badge variant="outline" className="text-xs">
                ✓ Completed
              </Badge>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-muted transition-colors"
              disabled={isDeleting}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleEditClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDeleteClick}
              className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProjectCardHeader;
