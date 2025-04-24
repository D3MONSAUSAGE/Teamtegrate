
import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from 'lucide-react';
import { Project } from '@/types';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

interface ProjectCardActionsProps {
  project: Project;
  onEdit?: () => void;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
}

const ProjectCardActions: React.FC<ProjectCardActionsProps> = ({
  project,
  onEdit,
  onViewTasks,
  onCreateTask,
}) => {
  const { updateProject, deleteProject } = useTask();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggleCompletion = () => {
    updateProject(project.id, { is_completed: !project.is_completed });
    toast.success(project.is_completed ? 'Project marked as active' : 'Project marked as completed');
  };

  const handleDeleteProject = () => {
    if (confirmDelete) {
      deleteProject(project.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-xs md:text-sm w-52">
        <DropdownMenuItem onClick={onEdit}>Edit Project</DropdownMenuItem>
        <DropdownMenuItem onClick={onViewTasks}>View Tasks</DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateTask}>Add New Task</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleCompletion}>
          {project.is_completed ? 'Mark as Active' : 'Mark as Completed'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={confirmDelete ? "text-red-500 font-semibold" : "text-red-500"} 
          onClick={handleDeleteProject}
        >
          {confirmDelete ? "Click again to confirm" : "Delete Project"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectCardActions;
