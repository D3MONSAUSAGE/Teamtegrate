
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
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300 border border-green-300/50';
      case 'in progress':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 border border-blue-300/50';
      case 'on hold':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-300 border border-yellow-300/50';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800/30 dark:to-gray-700/30 dark:text-gray-300 border border-gray-300/50';
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ProjectCardHeader: Edit menu item clicked for project:', project.id);
    onEditClick();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ProjectCardHeader: Delete menu item clicked for project:', project.id);
    onDeleteClick();
  };

  const handleDropdownTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ProjectCardHeader: Dropdown trigger clicked for project:', project.id);
  };

  return (
    <div className="p-6 pb-4 relative">
      {/* Priority indicator - subtle left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/60 via-accent/40 to-primary/20 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1 pr-2">
          <h3 className="text-xl font-bold text-card-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
            {project.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs font-semibold px-3 py-1 ${getStatusColor(project.status)} hover:scale-105 transition-transform duration-200`}
            >
              {project.status}
            </Badge>
            {project.isCompleted && (
              <Badge 
                variant="outline" 
                className="text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30"
              >
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
              className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-200"
              disabled={isDeleting}
              onClick={handleDropdownTriggerClick}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleEditClick}
              className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Edit Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDeleteClick}
              className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              <span className="font-medium">Delete Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProjectCardHeader;
