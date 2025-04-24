
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskForm } from '@/hooks/useTaskForm';
import TaskFormFieldsWithAI from './task/TaskFormFieldsWithAI';
import { useIsMobile } from '@/hooks/use-mobile';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
}

const CreateTaskDialogWithAI: React.FC<CreateTaskDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId 
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  const isMobile = useIsMobile();
  
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember
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
      setValue('deadline', new Date(editingTask.deadline).toISOString());
      setValue('projectId', editingTask.projectId || '');
      setSelectedMember(editingTask.assignedToId);
    }
  }, [open, editingTask, currentProjectId, setValue, reset, setSelectedMember]);

  const onSubmit = (data: any) => {
    // Handle the case where deadline might come as string or Date
    const deadlineDate = typeof data.deadline === 'string' 
      ? new Date(data.deadline)
      : data.deadline;

    if (isEditMode && editingTask) {
      updateTask(editingTask.id, {
        ...data,
        deadline: deadlineDate,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName
      });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: deadlineDate,
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName
      });
    }
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95%] p-4' : 'sm:max-w-[500px]'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${isMobile ? 'pt-2' : 'pt-4'}`}>
          <TaskFormFieldsWithAI
            register={register}
            errors={errors}
            setValue={setValue}
            selectedMember={selectedMember}
            setSelectedMember={setSelectedMember}
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
              size={isMobile ? "sm" : "default"}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              size={isMobile ? "sm" : "default"}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogWithAI;
