
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

  const handleDateChange = (date: Date | undefined) => {
    setDeadlineDate(date);
  };

  const handleTimeChange = (time: string) => {
    setTimeInput(time);
  };

  const handleSubmit = async () => {
    if (!deadlineDate) {
      toast.error('Please select a deadline date');
      return;
    }

    if (!form.getValues('title')?.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = timeInput.split(':');
      const deadline = new Date(deadlineDate);
      deadline.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const formData = form.getValues();
      
      // Get assigned users based on current selection
      let assignedUsers: User[] = [];
      if (selectedMembers.length > 0) {
        assignedUsers = users.filter(user => selectedMembers.includes(user.id));
      } else if (selectedMember && selectedMember !== "unassigned") {
        const user = users.find(u => u.id === selectedMember);
        if (user) assignedUsers = [user];
      }

      const taskData = {
        ...formData,
        deadline,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        projectId: formData.projectId === 'none' ? undefined : formData.projectId,
      };

      await onSubmit(taskData, assignedUsers);
      onTaskComplete?.();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskDetailsCard
            form={form}
            projects={projects}
            deadlineDate={deadlineDate}
            timeInput={timeInput}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
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
        </div>

        <TaskDialogActions
          isSubmitting={isSubmitting}
          editingTask={editingTask}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateTaskDialog;
