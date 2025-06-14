
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { TaskAssignmentService } from '@/services/taskAssignmentService';
import TaskFormTabs from './task/form/TaskFormTabs';
import UnifiedTaskAssignment from './task/assignment/UnifiedTaskAssignment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  onTaskComplete,
}) => {
  const { user } = useAuth();
  const { addTask, updateTask } = useTask();
  const { projects } = useProjects();
  const { teamMembers, isLoading: loadingUsers } = useTeamMembers();

  // Convert TeamMember[] to User[] with required properties
  const users: User[] = teamMembers.map(member => ({
    id: member.id,
    email: member.email,
    role: member.role as 'superadmin' | 'admin' | 'manager' | 'user',
    organizationId: member.organizationId,
    name: member.name,
    createdAt: new Date(), // Default value since TeamMember doesn't have this
    timezone: 'UTC', // Default value
    avatar_url: undefined
  }));

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>();
  const [timeInput, setTimeInput] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium' as 'Low' | 'Medium' | 'High',
      projectId: currentProjectId || 'none',
      cost: 0,
    }
  });

  // Initialize form and assignments when editing
  useEffect(() => {
    if (editingTask && open) {
      form.reset({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        projectId: editingTask.projectId || 'none',
        cost: editingTask.cost || 0,
      });

      // Set deadline
      if (editingTask.deadline) {
        const deadline = new Date(editingTask.deadline);
        setDeadlineDate(deadline);
        setTimeInput(deadline.toTimeString().slice(0, 5));
      }

      // Set assignments using unified service
      const assignments = TaskAssignmentService.getTaskAssignments(editingTask);
      if (assignments.assignedToIds && assignments.assignedToIds.length > 0) {
        const assignedUsers = users.filter(user => 
          assignments.assignedToIds?.includes(user.id)
        );
        setSelectedUsers(assignedUsers);
      }
    } else if (open && !editingTask) {
      // Reset for new task
      form.reset({
        title: '',
        description: '',
        priority: 'Medium',
        projectId: currentProjectId || 'none',
        cost: 0,
      });
      setSelectedUsers([]);
      setDeadlineDate(undefined);
      setTimeInput('09:00');
    }
  }, [editingTask, open, users, form, currentProjectId]);

  const handleSubmit = async (data: any) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    if (!deadlineDate) {
      toast.error('Please select a deadline');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = timeInput.split(':').map(Number);
      const deadline = new Date(deadlineDate);
      deadline.setHours(hours, minutes, 0, 0);

      // Prepare assignment data
      const assignmentData = selectedUsers.length > 0 ? {
        assignedToIds: selectedUsers.map(u => u.id),
        assignedToNames: selectedUsers.map(u => u.name || u.email),
        // For single assignment, also populate single fields for backward compatibility
        ...(selectedUsers.length === 1 && {
          assignedToId: selectedUsers[0].id,
          assignedToName: selectedUsers[0].name || selectedUsers[0].email
        })
      } : {};

      const taskData = {
        ...data,
        deadline,
        organizationId: user.organizationId,
        ...assignmentData,
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast.success('Task updated successfully!');
      } else {
        await addTask(taskData);
        toast.success('Task created successfully!');
      }

      onOpenChange(false);
      onTaskComplete?.();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-0">
              <TaskFormTabs
                register={form.register}
                errors={form.formState.errors}
                setValue={form.setValue}
                projects={projects}
                editingTask={editingTask}
                currentProjectId={currentProjectId}
                selectedMember={undefined}
                setSelectedMember={() => {}}
                deadlineDate={deadlineDate}
                timeInput={timeInput}
                onDateChange={setDeadlineDate}
                onTimeChange={setTimeInput}
                multiAssignMode={false}
                selectedMembers={[]}
                onMembersChange={() => {}}
                users={[]}
                loadingUsers={false}
                handleUserAssignment={() => {}}
              />
            </TabsContent>
            
            <TabsContent value="assignment" className="mt-0">
              <UnifiedTaskAssignment
                selectedUsers={selectedUsers}
                onSelectionChange={setSelectedUsers}
                availableUsers={users}
                isLoading={loadingUsers}
                disabled={isSubmitting}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editingTask ? 'Updating...' : 'Creating...') 
                : (editingTask ? 'Update Task' : 'Create Task')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogEnhanced;
