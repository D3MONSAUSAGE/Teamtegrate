
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Form } from "@/components/ui/form";
import { useTaskFormWithAI } from '@/hooks/useTaskFormWithAI';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskFormFieldsWithAI from './task/TaskFormFieldsWithAI';
import { TaskAssignmentSection } from '@/components/task/form/TaskAssignmentSection';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskCreated?: () => void;
}

const CreateTaskDialogWithAI: React.FC<CreateTaskDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId,
  onTaskCreated
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  const isMobile = useIsMobile();
  
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
  useEffect(() => {
    if (open) {
      console.log('Dialog opened with editingTask:', editingTask);
      console.log('CreateTaskDialogWithAI opened with currentProjectId:', currentProjectId);
    }
  }, [open, editingTask, currentProjectId]);

  const onSubmit = async (data: any) => {
    console.log('Form submission data:', data);
    
    try {
      // Ensure we have a valid deadline with time
      let deadlineDate = null;
      
      if (typeof data.deadline === 'string') {
        deadlineDate = new Date(data.deadline);
      } else {
        deadlineDate = data.deadline;
      }
      
      if (isNaN(deadlineDate.getTime())) {
        console.error('Invalid deadline date');
        return;
      }
      
      // Combine the date and time for the deadline
      if (timeInput) {
        const [hours, minutes] = timeInput.split(':').map(Number);
        deadlineDate.setHours(hours || 0, minutes || 0, 0, 0);
      }
      
      console.log('Final deadline with time:', deadlineDate);

      if (isEditMode && editingTask) {
        await updateTask(editingTask.id, {
          ...data,
          deadline: deadlineDate,
          assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
          assignedToName: data.assignedToName
        });
      } else {
        // Make sure we have a valid projectId or set it to undefined
        const projectId = data.projectId === "none" ? undefined : data.projectId;
        
        console.log('Adding task with projectId:', projectId);
        console.log('Adding task with assignment:', {
          assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
          assignedToName: data.assignedToName
        });
        
        await addTask({
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          deadline: deadlineDate,
          status: 'To Do',
          userId: user?.id || '',
          projectId: projectId,
          assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
          assignedToName: data.assignedToName,
          cost: data.cost ? Number(data.cost) : 0
        });
      }
      
      // Call onTaskCreated callback to refresh the task list with a small delay
      if (onTaskCreated) {
        console.log("Calling onTaskCreated callback");
        setTimeout(() => {
          onTaskCreated();
        }, 300); // Slight increase in delay to allow database to update
      }
      
      onOpenChange(false);
      reset();
      setSelectedMember(undefined);
    } catch (error) {
      console.error('Error submitting task form:', error);
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
                  projects={projects}
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
                  register={register}
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  setValue={setValue}
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
