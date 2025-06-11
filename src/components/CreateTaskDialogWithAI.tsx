
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlatTask } from '@/types/flat';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Form } from "@/components/ui/form";
import { useTaskFormWithAI } from '@/hooks/useTaskFormWithAI';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskFormFieldsWithAI from './task/TaskFormFieldsWithAI';
import TaskAssignmentSection from '@/components/task/form/TaskAssignmentSection';
import { useUsers } from '@/hooks/useUsers';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: FlatTask;
  currentProjectId?: string;
  onTaskComplete?: () => void;
}

const CreateTaskDialogWithAI: React.FC<CreateTaskDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId,
  onTaskComplete
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  const isMobile = useIsMobile();
  const { users, isLoading: loadingUsers } = useUsers();
  
  // Use our custom hook for form management
  const {
    form,
    handleSubmit,
    register,
    errors, 
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange
  } = useTaskFormWithAI(editingTask, currentProjectId);

  // Log when dialog opens/closes with editing task
  React.useEffect(() => {
    if (open) {
      console.log('Dialog opened with editingTask:', editingTask);
    }
  }, [open, editingTask]);

  const handleUserAssignment = (userId: string) => {
    console.log('Assigning user:', userId);
    
    if (userId === "unassigned") {
      console.log('Setting user to unassigned');
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
      return;
    }
    
    const selectedUser = users.find(user => user.id === userId);
    console.log('Selected user:', selectedUser);
    
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name || selectedUser.email);
    }
  };

  const onSubmit = (data: any) => {
    console.log('Form submission data:', data);
    
    if (!user?.organization_id) {
      console.error('User organization_id is required');
      return;
    }
    
    // Handle the case where deadline might come as string or Date
    const deadlineDate = typeof data.deadline === 'string' 
      ? new Date(data.deadline)
      : data.deadline;

    if (isEditMode && editingTask) {
      updateTask(editingTask.id, {
        ...data,
        deadline: deadlineDate,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName,
        cost: Number(data.cost) || 0,
        organizationId: user.organization_id
      });
    } else {
      const newTask: Omit<FlatTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        deadline: deadlineDate,
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName,
        assignedToIds: selectedMember && selectedMember !== "unassigned" ? [selectedMember] : [],
        assignedToNames: data.assignedToName ? [data.assignedToName] : [],
        cost: Number(data.cost) || 0,
        organizationId: user.organization_id
      };
      addTask(newTask);
    }
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
    
    // Call the onTaskComplete callback if provided
    if (onTaskComplete) {
      onTaskComplete();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95%] p-4' : 'sm:max-w-[550px]'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Task Details</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <TaskFormFieldsWithAI
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  projects={projects as any}
                  editingTask={editingTask}
                  currentProjectId={currentProjectId}
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  date={deadlineDate}
                  timeInput={timeInput}
                  onDateChange={handleDateChange}
                  onTimeChange={handleTimeChange}
                />
              </TabsContent>
              
              <TabsContent value="assignment">
                <TaskAssignmentSection 
                  selectedMember={selectedMember || "unassigned"}
                  onAssign={handleUserAssignment}
                  users={users}
                  isLoading={loadingUsers}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">
                {isEditMode ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogWithAI;
