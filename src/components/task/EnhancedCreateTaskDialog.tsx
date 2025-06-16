
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target } from 'lucide-react';
import { format } from "date-fns";
import { Task, User, Project, TaskPriority } from '@/types';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import TaskDetailsCard from './TaskDetailsCard';
import EnhancedTaskAssignment from './form/assignment/EnhancedTaskAssignment';
import TaskDialogActions from './TaskDialogActions';

interface EnhancedCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
  projects: Project[];
  users: User[];
  loadingUsers: boolean;
  onSubmit: (data: any, selectedUsers: User[]) => Promise<void>;
}

const EnhancedCreateTaskDialog: React.FC<EnhancedCreateTaskDialogProps> = ({
  open,
  onOpenChange,
  editingTask,
  currentProjectId,
  onTaskComplete,
  projects,
  users,
  loadingUsers,
  onSubmit
}) => {
  const [selectedMember, setSelectedMember] = useState<string | undefined>("unassigned");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [timeInput, setTimeInput] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium' as TaskPriority,
      projectId: currentProjectId || 'none',
      cost: ''
    }
  });

  // Initialize form data when editing
  useEffect(() => {
    if (editingTask && open) {
      form.setValue('title', editingTask.title);
      form.setValue('description', editingTask.description);
      form.setValue('priority', editingTask.priority);
      form.setValue('projectId', editingTask.projectId || 'none');
      form.setValue('cost', editingTask.cost?.toString() || '');
      
      setDeadlineDate(new Date(editingTask.deadline));
      setTimeInput(format(new Date(editingTask.deadline), 'HH:mm'));
      
      // Set assigned users based on assignment type
      if (editingTask.assignedToIds && editingTask.assignedToIds.length > 0) {
        setSelectedMembers(editingTask.assignedToIds);
        if (editingTask.assignedToIds.length === 1) {
          setSelectedMember(editingTask.assignedToIds[0]);
        }
      } else if (editingTask.assignedToId) {
        setSelectedMember(editingTask.assignedToId);
        setSelectedMembers([editingTask.assignedToId]);
      }
    } else if (!editingTask && open) {
      // Reset form for new task
      form.reset();
      setSelectedMember("unassigned");
      setSelectedMembers([]);
      setDeadlineDate(undefined);
      setTimeInput('09:00');
    }
  }, [editingTask, open, users, form, currentProjectId]);

  const handleAssign = (userId: string) => {
    setSelectedMember(userId);
  };

  const handleMembersChange = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
  };

  const handleSubmit = async (data: any) => {
    if (!deadlineDate) {
      toast.error('Please select a deadline');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const [hours, minutes] = timeInput.split(':');
      const finalDeadline = new Date(deadlineDate);
      finalDeadline.setHours(parseInt(hours), parseInt(minutes));

      const taskData = {
        ...data,
        deadline: finalDeadline,
        cost: data.cost ? parseFloat(data.cost) : 0,
        projectId: data.projectId === 'none' ? undefined : data.projectId
      };

      // Determine which users are selected based on assignment mode
      const assignedUsers = selectedMembers.length > 0 
        ? users.filter(user => selectedMembers.includes(user.id))
        : selectedMember && selectedMember !== "unassigned" 
          ? users.filter(user => user.id === selectedMember)
          : [];

      await onSubmit(taskData, assignedUsers);
      onTaskComplete?.();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-muted/5 to-background">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <TaskDetailsCard
            form={form}
            deadlineDate={deadlineDate}
            setDeadlineDate={setDeadlineDate}
            timeInput={timeInput}
            setTimeInput={setTimeInput}
            projects={projects}
            currentProjectId={currentProjectId}
          />

          <EnhancedTaskAssignment
            selectedMember={selectedMember}
            selectedMembers={selectedMembers}
            onAssign={handleAssign}
            onMembersChange={handleMembersChange}
            users={users}
            isLoading={loadingUsers}
            editingTask={editingTask}
          />

          <TaskDialogActions
            isSubmitting={isSubmitting}
            editingTask={editingTask}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateTaskDialog;
