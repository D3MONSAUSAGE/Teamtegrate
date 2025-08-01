
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Project } from '@/types';
import ProjectCardHeader from './ProjectCardHeader';
import ProjectCardContent from './ProjectCardContent';
import ProjectDeleteDialog from './ProjectDeleteDialog';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import EditProjectDialog from '../project/EditProjectDialog';

interface ProjectCardProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
  onDeleted?: () => void;
}

const ProjectCard = ({ project, onViewTasks, onCreateTask, onDeleted }: ProjectCardProps) => {
  console.log('ProjectCard: Rendering for project:', project.id, 'with handlers:', {
    hasOnViewTasks: !!onViewTasks,
    hasOnCreateTask: !!onCreateTask,
    hasOnDeleted: !!onDeleted
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { deleteProject, refreshProjects } = useTask();

  const handleDelete = async () => {
    try {
      console.log('ProjectCard: Deleting project:', project.id);
      setIsDeleting(true);
      await deleteProject(project.id);
      toast.success('Project deleted successfully');
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('ProjectCard: Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEditClick = () => {
    console.log('ProjectCard: Edit button clicked for project:', project.id);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    console.log('ProjectCard: Edit success, refreshing projects');
    refreshProjects();
    toast.success("Project updated successfully");
    setShowEditDialog(false);
  };

  const handleEditCancel = () => {
    console.log('ProjectCard: Edit dialog cancelled');
    setShowEditDialog(false);
  };

  const handleDeleteClick = () => {
    console.log('ProjectCard: Delete button clicked for project:', project.id);
    setShowDeleteDialog(true);
  };

  const handleViewTasks = () => {
    console.log('ProjectCard: View tasks handler called for project:', project.id);
    if (onViewTasks) {
      console.log('ProjectCard: Calling onViewTasks handler');
      onViewTasks();
    } else {
      console.warn('ProjectCard: onViewTasks not provided');
    }
  };

  const handleCreateTask = () => {
    console.log('ProjectCard: Create task handler called for project:', project.id);
    if (onCreateTask) {
      console.log('ProjectCard: Calling onCreateTask handler');
      onCreateTask();
    } else {
      console.warn('ProjectCard: onCreateTask not provided');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on the card itself, not on buttons or interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, [role="button"]');
    
    if (!isInteractiveElement && onViewTasks) {
      console.log('ProjectCard: Card clicked, opening project');
      handleViewTasks();
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden relative z-10 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:border-primary/20 group"
        onClick={handleCardClick}
      >
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <ProjectCardHeader 
          project={project} 
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          isDeleting={isDeleting} 
        />
        <ProjectCardContent 
          project={project}
          onViewTasks={handleViewTasks}
          onCreateTask={handleCreateTask}
        />
      </Card>

      <ProjectDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        projectTitle={project.title}
        isDeleting={isDeleting}
      />

      <EditProjectDialog 
        open={showEditDialog}
        onOpenChange={handleEditCancel}
        project={project}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default ProjectCard;
