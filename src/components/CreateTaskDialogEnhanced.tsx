
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Form } from "@/components/ui/form";
import { useTaskFormWithAI } from '@/hooks/useTaskFormWithAI';
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
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

  // Enhanced data validation
  const isValidArray = (arr: any): arr is any[] => {
    return Array.isArray(arr) && arr !== null && arr !== undefined;
  };

  const isValidUser = (user: any): user is any => {
    return user && 
           typeof user === 'object' && 
           typeof user.id === 'string' && 
           typeof user.name === 'string';
  };

  // Safe users array with comprehensive validation
  const safeUsers = isValidArray(users) ? users.filter(isValidUser) : [];
  const safeSelectedMembers = isValidArray(selectedMembers) ? selectedMembers.filter(id => typeof id === 'string' && id.length > 0) : [];

  console.log('CreateTaskDialogEnhanced - data validation:', {
    usersOriginal: users?.length || 'invalid',
    usersFiltered: safeUsers.length,
    selectedMembersOriginal: selectedMembers?.length || 'invalid',
    selectedMembersFiltered: safeSelectedMembers.length,
    loadingUsers,
    usersError: !!usersError
  });

  // Initialize multi-assign mode and selected members for editing
  React.useEffect(() => {
    if (editingTask && editingTask.assignedToIds && editingTask.assignedToIds.length > 1) {
      setMultiAssignMode(true);
      setSelectedMembers(editingTask.assignedToIds);
    }
  }, [editingTask]);

  // Handle users loading error
  React.useEffect(() => {
    if (usersError) {
      console.error('Error loading users:', usersError);
      toast.error('Failed to load team members');
    }
  }, [usersError]);

  const handleUserAssignment = (userId: string) => {
    console.log('Assigning user:', userId);
    
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId in handleUserAssignment:', userId);
      return;
    }
    
    if (userId === "unassigned") {
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
      return;
    }
    
    const selectedUser = safeUsers.find(user => user && user.id === userId);
    
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name || selectedUser.email);
    } else {
      console.error('User not found in safeUsers array:', userId);
    }
  };

  const handleMembersChange = (memberIds: string[]) => {
    console.log('handleMembersChange called with:', memberIds);
    
    // Enhanced validation for memberIds
    if (!isValidArray(memberIds)) {
      console.error('Invalid memberIds passed to handleMembersChange:', memberIds);
      return;
    }
    
    const validMemberIds = memberIds.filter(id => typeof id === 'string' && id.length > 0);
    setSelectedMembers(validMemberIds);
    
    // Update form values for multi-assignment
    const selectedUsers = safeUsers.filter(user => user && validMemberIds.includes(user.id));
    setValue('assignedToIds', validMemberIds);
    setValue('assignedToNames', selectedUsers.map(user => user.name || user.email));
  };

  const handleMembersError = () => {
    console.error('Error in TaskMultiAssigneeSelect component');
    toast.error('Error managing team member selection');
  };

  const onSubmit = (data: any) => {
    console.log('Form submission data:', data);
    
    const deadlineDate = typeof data.deadline === 'string' 
      ? new Date(data.deadline)
      : data.deadline;

    const taskData = {
      ...data,
      deadline: deadlineDate,
      // Handle single vs multi assignment
      assignedToId: multiAssignMode ? undefined : (selectedMember === "unassigned" ? undefined : selectedMember),
      assignedToName: multiAssignMode ? undefined : data.assignedToName,
      assignedToIds: multiAssignMode ? selectedMembers : undefined,
      assignedToNames: multiAssignMode ? 
        (safeUsers.filter(u => selectedMembers.includes(u.id)).map(u => u.name || u.email)) : 
        undefined
    };

    if (isEditMode && editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: deadlineDate,
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId,
        ...taskData
      });
    }
    
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
    setSelectedMembers([]);
    
    if (onTaskComplete) {
      onTaskComplete();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
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
              projects={projects}
              editingTask={editingTask}
              currentProjectId={currentProjectId}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              deadlineDate={deadlineDate}
              timeInput={timeInput}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              multiAssignMode={multiAssignMode}
              selectedMembers={safeSelectedMembers}
              onMembersChange={handleMembersChange}
              users={safeUsers}
              loadingUsers={loadingUsers}
              handleUserAssignment={handleUserAssignment}
            />
            
            <TaskFormActions
              isEditMode={isEditMode}
              onCancel={handleCancel}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogEnhanced;
