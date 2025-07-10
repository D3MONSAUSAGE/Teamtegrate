
import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Task, Project } from '@/types';
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
import { toast } from '@/components/ui/sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use our custom hook for form management
  const {
    form,
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

  const onSubmit = useCallback(async (data: any) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const finalTaskData = {
        ...data,
        userId: user.id,
        organizationId: user.organizationId
      };

      if (editingTask) {
        await updateTask(editingTask.id, finalTaskData);
        toast.success('Task updated successfully');
      } else {
        await addTask(finalTaskData);
        toast.success('Task created successfully');
      }
      
      onOpenChange(false);
      onTaskComplete?.();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(`Failed to ${editingTask ? 'update' : 'create'} task`);
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.organizationId, editingTask, updateTask, addTask, onOpenChange, onTaskComplete, user?.id]);

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
  };

  // Transform users to match the expected interface
  const teamMembers = users.map(user => ({
    id: user.id,
    name: user.name || user.email || 'Unknown User',
    email: user.email
  }));

  // Type-safe projects casting - ensure proper date string conversion
  const typedProjects: Project[] = projects.map(project => ({
    id: project.id,
    title: project.title || 'Untitled Project',
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    managerId: project.managerId,
    createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : (project.createdAt || new Date().toISOString()),
    updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : (project.updatedAt || new Date().toISOString()),
    teamMemberIds: project.teamMemberIds || [],
    budget: project.budget,
    budgetSpent: project.budgetSpent || 0,
    isCompleted: project.isCompleted || false,
    status: project.status || 'To Do',
    tasksCount: project.tasksCount || 0,
    tags: project.tags || [],
    organizationId: project.organizationId || user?.organizationId || '',
    teamMembers: project.teamMembers || [],
    comments: project.comments || []
  }));

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Task Details</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <TaskFormFieldsWithAI
                  form={form}
                  projects={typedProjects}
                  teamMembers={teamMembers}
                  showProjectField={true}
                  showAssignmentFields={false}
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
              <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogWithAI;
