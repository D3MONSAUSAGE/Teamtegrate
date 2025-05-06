
import { useState, useCallback } from 'react';
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
