
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import TaskFormFields from './task/TaskFormFields';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskForm } from '@/hooks/useTaskForm';
import TaskFormActions from './task/form/TaskFormActions';

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

  const handleCancel = () => {
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
          <TaskFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            selectedMember={selectedMember}
            setSelectedMember={setSelectedMember}
            projects={projects}
            editingTask={editingTask}
            currentProjectId={currentProjectId}
          />
          
          <TaskFormActions 
            isEditMode={isEditMode}
            onCancel={handleCancel}
            isMobile={isMobile}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
