
import { useState, useCallback } from 'react';
import { Task } from '@/types';

export const useProjectDialogs = (refetch: () => void) => {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    refetch();
  }, [refetch]);

  const handleEditProject = useCallback(() => {
    setIsEditProjectOpen(true);
  }, []);

  const handleProjectUpdated = useCallback(() => {
    setIsEditProjectOpen(false);
  }, []);

  return {
    isCreateTaskOpen,
    setIsCreateTaskOpen,
    editingTask,
    isEditProjectOpen,
    setIsEditProjectOpen,
    handleEditTask,
    handleCreateTask,
    handleTaskDialogComplete,
    handleEditProject,
    handleProjectUpdated
  };
};
