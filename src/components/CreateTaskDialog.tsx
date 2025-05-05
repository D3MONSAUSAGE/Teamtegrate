
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskForm } from '@/hooks/useTaskForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDetailsSection } from '@/components/task/form/TaskDetailsSection';
import { TaskAssignmentSection } from '@/components/task/form/TaskAssignmentSection';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskCreated?: () => void;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ 
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
  
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember
  } = useTaskForm(editingTask, currentProjectId);

  const onSubmit = async (data: any) => {
    // Handle the case where deadline might come as string or Date
    const deadlineDate = typeof data.deadline === 'string' 
      ? new Date(data.deadline)
      : data.deadline;

    try {
      if (isEditMode && editingTask) {
        await updateTask(editingTask.id, {
          ...data,
          deadline: deadlineDate,
          assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
          assignedToName: data.assignedToName
        });
      } else {
        await addTask({
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
      
      // Call the onTaskCreated callback if provided
      if (onTaskCreated) {
        console.log("Calling onTaskCreated callback from CreateTaskDialog");
        setTimeout(() => {
          onTaskCreated();
        }, 100);
      }
      
      onOpenChange(false);
      reset();
      setSelectedMember(undefined);
    } catch (error) {
      console.error("Error submitting task:", error);
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
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <TaskDetailsSection 
                register={register}
                errors={errors}
                projects={projects}
                editingTask={editingTask}
                currentProjectId={currentProjectId}
                setValue={setValue}
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
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
