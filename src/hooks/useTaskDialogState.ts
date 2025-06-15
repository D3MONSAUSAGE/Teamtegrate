
import { useState, useEffect } from 'react';
import { User, Task } from '@/types';
import { useForm } from 'react-hook-form';
import { TaskAssignmentService } from '@/services/taskAssignmentService';

interface UseTaskDialogStateProps {
  editingTask?: Task;
  currentProjectId?: string;
  open: boolean;
  users: User[];
}

export const useTaskDialogState = ({ 
  editingTask, 
  currentProjectId, 
  open, 
  users 
}: UseTaskDialogStateProps) => {
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

      // Set assignments using the correct service method
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

  return {
    selectedUsers,
    setSelectedUsers,
    deadlineDate,
    setDeadlineDate,
    timeInput,
    setTimeInput,
    isSubmitting,
    setIsSubmitting,
    form
  };
};
