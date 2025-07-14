
import React from 'react';
import { Project, Task } from '@/types';
import EnhancedCreateTaskDialog from '../../EnhancedCreateTaskDialog';
import EditProjectDialog from '../../../project/EditProjectDialog';

interface ProjectTasksDialogsProps {
  project: Project | null;
  projectId: string | undefined;
  isCreateTaskOpen: boolean;
  setIsCreateTaskOpen: (open: boolean) => void;
  editingTask: Task | undefined;
  isEditProjectOpen: boolean;
  setIsEditProjectOpen: (open: boolean) => void;
  onTaskDialogComplete: () => void;
  onProjectUpdated: () => void;
}

const ProjectTasksDialogs: React.FC<ProjectTasksDialogsProps> = ({
  project,
  projectId,
  isCreateTaskOpen,
  setIsCreateTaskOpen,
  editingTask,
  isEditProjectOpen,
  setIsEditProjectOpen,
  onTaskDialogComplete,
  onProjectUpdated
}) => {
  return (
    <>
      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId}
        onTaskComplete={onTaskDialogComplete}
      />

      {project && (
        <EditProjectDialog
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
          project={project}
          onSuccess={onProjectUpdated}
        />
      )}
    </>
  );
};

export default ProjectTasksDialogs;
