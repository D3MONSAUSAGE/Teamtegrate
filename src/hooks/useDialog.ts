
import { useState, useCallback, useEffect } from 'react';
import { Task } from '@/types';

// This is a global state for dialogs across the application
let createTaskDialogCallback: ((task?: Task) => void) | null = null;

export const useDialog = () => {
  // Register callback for opening the create task dialog
  const registerCreateTaskDialog = useCallback((callback: (task?: Task) => void) => {
    createTaskDialogCallback = callback;
  }, []);

  // Open the create task dialog
  const openCreateTaskDialog = useCallback((task?: Task) => {
    if (createTaskDialogCallback) {
      createTaskDialogCallback(task);
    } else {
      console.error('Create task dialog callback not registered');
    }
  }, []);

  return {
    registerCreateTaskDialog,
    openCreateTaskDialog
  };
};

// Helper hook to easily create and register a task dialog
export const useCreateTaskDialog = () => {
  const { registerCreateTaskDialog, openCreateTaskDialog } = useDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);

  // Register the callback to open the dialog
  useEffect(() => {
    registerCreateTaskDialog((task?: Task) => {
      setCurrentTask(task);
      setIsOpen(true);
    });
  }, [registerCreateTaskDialog]);

  return {
    isOpen,
    setIsOpen,
    currentTask,
    openCreateTaskDialog
  };
};
