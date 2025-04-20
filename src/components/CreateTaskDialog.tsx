
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useTaskForm } from '@/hooks/useTaskForm';
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
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    appUsers,
    isLoadingUsers
  } = useTaskForm(editingTask, currentProjectId);

  // Set initial projectId value when: dialog opens, or currentProjectId changes, and only if not editing
  useEffect(() => {
    if (open && !editingTask && currentProjectId) {
      setValue('projectId', currentProjectId);
    }
    // If dialog closed and not editing, reset form
    if (!open && !editingTask) {
      reset();
      setSelectedMember(undefined);
    }
    // If editing, always update form fields properly
    if (editingTask) {
      setValue('title', editingTask.title);
      setValue('description', editingTask.description);
      setValue('priority', editingTask.priority);
      setValue('deadline', format(new Date(editingTask.deadline), "yyyy-MM-dd'T'HH:mm"));
      setValue('projectId', editingTask.projectId || '');
      setSelectedMember(editingTask.assignedToId);
    }
  }, [open, editingTask, currentProjectId, setValue, reset, setSelectedMember]);

  const onSubmit = (data: any) => {
    if (isEditMode && editingTask) {
      updateTask(editingTask.id, {
        ...data,
        deadline: new Date(data.deadline),
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: selectedMember && selectedMember !== "unassigned" ? 
          appUsers?.find(m => m.id === selectedMember)?.name : undefined
      });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: new Date(data.deadline),
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId, // Now always set
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: selectedMember && selectedMember !== "unassigned" ? 
          appUsers?.find(m => m.id === selectedMember)?.name : undefined
      });
    }
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TaskFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            selectedMember={selectedMember}
            setSelectedMember={setSelectedMember}
            appUsers={appUsers}
            isLoadingUsers={isLoadingUsers}
            projects={projects}
            editingTask={editingTask}
            currentProjectId={currentProjectId}
          />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                reset();
                setSelectedMember(undefined);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;

