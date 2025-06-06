
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskFormValues, AppUser } from '@/types';
import { toast } from '@/components/ui/sonner';
import TaskFormFields from './task/TaskFormFields';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  editingTask,
  currentProjectId
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, users, fetchUsers } = useTask();
  const [isLoading, setIsLoading] = useState(false);
  const [multiSelect, setMultiSelect] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open && fetchUsers) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  const handleSubmit = async (values: TaskFormValues) => {
    if (!user) {
      toast.error('You must be logged in to create tasks');
      return;
    }

    setIsLoading(true);
    
    try {
      const taskData = {
        ...values,
        deadline: new Date(values.deadline),
        projectId: currentProjectId || values.projectId,
        userId: user.id,
        status: 'To Do' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast.success('Task updated successfully!');
      } else {
        await addTask(taskData);
        toast.success('Task created successfully!');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <TaskFormFields
          onSubmit={handleSubmit}
          editingTask={editingTask}
          isLoading={isLoading}
          users={users as AppUser[]}
          multiSelect={multiSelect}
          onMultiSelectChange={setMultiSelect}
          currentProjectId={currentProjectId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
