
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { FlatProject } from '@/types/flat';
import ProjectCardHeader from './ProjectCardHeader';
import ProjectCardContent from './ProjectCardContent';
import ProjectDeleteDialog from './ProjectDeleteDialog';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import EditProjectDialog from '../project/EditProjectDialog';
import { flatProjectToProject } from '@/utils/typeConversions';

interface ProjectCardProps {
  project: FlatProject;
  onViewTasks?: () => void;
  onCreateTask?: () => void;
  onDeleted?: () => void;
}

const ProjectCard = ({ project, onViewTasks, onCreateTask, onDeleted }: ProjectCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { deleteProject, refreshProjects, tasks } = useTask();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      toast.success('Project deleted successfully');
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEditSuccess = () => {
    refreshProjects();
    toast.success("Project updated successfully");
  };

  // Convert FlatProject to Project for components that expect Project type
  const convertedProject = flatProjectToProject(project, tasks);

  return (
    <>
      <Card className="overflow-hidden">
        <ProjectCardHeader 
          project={convertedProject} 
          onDeleteClick={() => setShowDeleteDialog(true)}
          onEditClick={() => setShowEditDialog(true)}
          isDeleting={isDeleting} 
        />
        <ProjectCardContent 
          project={convertedProject}
          onViewTasks={onViewTasks}
          onCreateTask={onCreateTask}
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
        onOpenChange={setShowEditDialog}
        project={convertedProject}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default ProjectCard;
