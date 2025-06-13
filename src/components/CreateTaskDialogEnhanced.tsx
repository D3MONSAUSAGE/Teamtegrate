
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Form } from "@/components/ui/form";
import { useEnhancedTaskForm } from '@/hooks/useEnhancedTaskForm';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import TaskDialogHeader from './task/form/TaskDialogHeader';
import TaskFormTabs from './task/form/TaskFormTabs';
import TaskFormActions from './task/form/TaskFormActions';
import { toast } from '@/components/ui/sonner';

interface CreateTaskDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
}

const CreateTaskDialogEnhanced: React.FC<CreateTaskDialogEnhancedProps> = ({ 
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
  const { users, isLoading: loadingUsers, error: usersError } = useUsers();
  const [multiAssignMode, setMultiAssignMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use our enhanced task form hook
  const {
    form,
    handleSubmit,
    register,
    errors, 
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    selectedMembers,
    setSelectedMembers,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange,
    handleUserAssignment,
    handleMembersChange,
  } = useEnhancedTaskForm(editingTask, currentProjectId);

  // Initialize multi-assign mode for editing tasks with multiple assignees
  React.useEffect(() => {
    if (editingTask && editingTask.assignedToIds && editingTask.assignedToIds.length > 1) {
      setMultiAssignMode(true);
    }
  }, [editingTask]);

  // Handle users loading error
  React.useEffect(() => {
    if (usersError) {
      console.error('Error loading users:', usersError);
      toast.error('Failed to load team members');
    }
  }, [usersError]);

  const onSubmit = async (data: any) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const deadlineDate = typeof data.deadline === 'string' 
        ? new Date(data.deadline)
        : data.deadline;

      const taskData = {
        ...data,
        deadline: deadlineDate,
        userId: user.id,
        organizationId: user.organizationId,
        // Handle single vs multi assignment
        assignedToId: multiAssignMode ? undefined : (selectedMember === "unassigned" ? undefined : selectedMember),
        assignedToName: multiAssignMode ? undefined : data.assignedToName,
        assignedToIds: multiAssignMode ? selectedMembers : undefined,
        assignedToNames: multiAssignMode ? data.assignedToNames : undefined
      };

      if (isEditMode && editingTask) {
        await updateTask(editingTask.id, taskData);
        toast.success('Task updated successfully');
      } else {
        await addTask({
          title: data.title,
          description: data.description,
          priority: data.priority,
          deadline: deadlineDate,
          status: 'To Do',
          projectId: data.projectId === "none" ? undefined : data.projectId,
          ...taskData
        });
        toast.success('Task created successfully');
      }
      
      onOpenChange(false);
      reset();
      setSelectedMember("unassigned");
      setSelectedMembers([]);
      
      if (onTaskComplete) {
        onTaskComplete();
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} task`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedMember("unassigned");
    setSelectedMembers([]);
  };

  const getCompletionPercentage = () => {
    const requiredFields = ['title'];
    const optionalFields = ['description', 'priority', 'deadline'];
    
    let completed = 0;
    let total = requiredFields.length + optionalFields.length;
    
    // Check required fields
    if (form.watch('title')?.trim()) completed++;
    
    // Check optional fields
    if (form.watch('description')?.trim()) completed++;
    if (form.watch('priority')) completed++;
    if (deadlineDate) completed++;
    
    return Math.round((completed / total) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "glass-card backdrop-blur-xl border-2 border-border/30 shadow-2xl",
        "bg-gradient-to-br from-background/95 via-background/90 to-background/85",
        isMobile ? 'w-[95%] p-4 max-h-[90vh]' : 'sm:max-w-[600px] max-h-[85vh]',
        "overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300"
      )}>
        <TaskDialogHeader
          isEditMode={isEditMode}
          completionPercentage={getCompletionPercentage()}
          multiAssignMode={multiAssignMode}
          onMultiAssignToggle={setMultiAssignMode}
        />
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TaskFormTabs
              register={register}
              errors={errors}
              setValue={setValue}
              projects={projects as any}
              editingTask={editingTask}
              currentProjectId={currentProjectId}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              deadlineDate={deadlineDate}
              timeInput={timeInput}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              multiAssignMode={multiAssignMode}
              selectedMembers={selectedMembers}
              onMembersChange={handleMembersChange}
              users={users}
              loadingUsers={loadingUsers}
              handleUserAssignment={handleUserAssignment}
            />
            
            <TaskFormActions
              isEditMode={isEditMode}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogEnhanced;
