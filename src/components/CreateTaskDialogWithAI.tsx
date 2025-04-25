
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task, AppUser } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from "react-hook-form";
import TaskFormFieldsWithAI from './task/TaskFormFieldsWithAI';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUsers } from '@/hooks/useUsers';
import { Form } from "@/components/ui/form";
import { format } from 'date-fns';

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
  const { users, isLoading: isLoadingUsers } = useUsers();
  
  // Add deadline state management
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editingTask ? new Date(editingTask.deadline) : new Date()
  );
  const [timeInput, setTimeInput] = useState(
    editingTask ? format(new Date(editingTask.deadline), 'HH:mm') : "12:00"
  );
  
  // Setup form with react-hook-form
  const form = useForm({
    defaultValues: {
      title: editingTask?.title || '',
      description: editingTask?.description || '',
      priority: editingTask?.priority || 'Medium',
      deadline: editingTask?.deadline ? new Date(editingTask.deadline).toISOString() : new Date().toISOString(),
      projectId: editingTask?.projectId || currentProjectId || '',
      cost: editingTask?.cost || '',
      assignedToId: editingTask?.assignedToId || '',
      assignedToName: editingTask?.assignedToName || ''
    }
  });
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = form;
  const [selectedMember, setSelectedMember] = useState<string | undefined>(
    editingTask?.assignedToId
  );

  // Update deadline state when editing task changes
  useEffect(() => {
    if (editingTask) {
      const taskDate = new Date(editingTask.deadline);
      setDeadlineDate(taskDate);
      setTimeInput(format(taskDate, 'HH:mm'));
    } else {
      const today = new Date();
      setDeadlineDate(today);
      setTimeInput("12:00");
    }
  }, [editingTask]);

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
  }, [open, editingTask, currentProjectId, setValue, reset]);

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setDeadlineDate(date);
    
    // Preserve time if time was already set
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0);
      setValue('deadline', newDate.toISOString());
    } else {
      setValue('deadline', date.toISOString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeInput = e.target.value;
    setTimeInput(newTimeInput);
    
    if (deadlineDate && newTimeInput) {
      const [hours, minutes] = newTimeInput.split(':').map(Number);
      const newDate = new Date(deadlineDate);
      newDate.setHours(hours || 0, minutes || 0);
      setValue('deadline', newDate.toISOString());
    }
  };

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
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className={`space-y-3 ${isMobile ? 'pt-2' : 'pt-4'}`}>
            <TaskFormFieldsWithAI
              register={register}
              errors={errors}
              setValue={setValue}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              projects={projects}
              editingTask={editingTask}
              currentProjectId={currentProjectId}
              date={deadlineDate}
              timeInput={timeInput}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
            />
            
            <div className="flex justify-end gap-2 pt-2">
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogWithAI;
