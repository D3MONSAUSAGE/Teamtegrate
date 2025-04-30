
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Project } from '@/types';
import ProjectCardHeader from './ProjectCardHeader';
import ProjectCardContent from './ProjectCardContent';
import ProjectDeleteDialog from './ProjectDeleteDialog';
import { useTask } from '@/contexts/task';

interface ProjectCardProps {
  project: Project;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
  onDeleted?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewTasks, onCreateTask, onDeleted }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteProject } = useTask();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden border hover:shadow-md transition-shadow">
        <ProjectCardHeader 
          project={project} 
          onDeleteClick={() => setShowDeleteDialog(true)} 
          isDeleting={isDeleting} 
        />
        <ProjectCardContent 
          project={project}
          onViewTasks={onViewTasks}
          onCreateTask={onCreateTask}
        />
      </Card>

      <ProjectDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        isDeleting={isDeleting}
        onDelete={handleDelete}
      />
    </>
  );
};

export default ProjectCard;
