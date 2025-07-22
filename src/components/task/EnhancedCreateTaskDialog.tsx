
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Briefcase, Users, Calendar, DollarSign } from 'lucide-react';
import { format } from "date-fns";
import { Task, User, Project, TaskPriority, UserRole } from '@/types';
import { TaskFormData } from '@/types/forms';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useTaskSubmission } from '@/hooks/useTaskSubmission';
import { useAuth } from '@/contexts/AuthContext';
import { devLog } from '@/utils/devLogger';
import { logger } from '@/utils/logger';
import MobileTaskForm from './mobile/MobileTaskForm';
import EnhancedTaskAssignment from './form/assignment/EnhancedTaskAssignment';
import TaskScheduleSection from './form/TaskScheduleSection';
import TaskDialogActions from './TaskDialogActions';

interface EnhancedCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
}

const EnhancedCreateTaskDialog: React.FC<EnhancedCreateTaskDialogProps> = ({
  open,
  onOpenChange,
  editingTask,
  currentProjectId,
  onTaskComplete,
}) => {
  const { user: currentUser } = useAuth();
  const { projects } = useProjects();
  const { users, isLoading: loadingUsers, refetch: refetchUsers } = useOrganizationTeamMembers();
  const { submitTask } = useTaskSubmission();

  const [selectedMember, setSelectedMember] = useState<string | undefined>("unassigned");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [timeInput, setTimeInput] = useState('09:00');
  
  const [scheduledStartDate, setScheduledStartDate] = useState<Date | undefined>(undefined);
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>(undefined);
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  
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

  // Force refresh users when dialog opens to ensure latest data
  useEffect(() => {
    if (open) {
      devLog.taskOperation('Dialog opened, refreshing users');
      refetchUsers();
    }
  }, [open, refetchUsers]);

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
      
      if (editingTask.scheduledStart) {
        setScheduledStartDate(new Date(editingTask.scheduledStart));
        setScheduledStartTime(format(new Date(editingTask.scheduledStart), 'HH:mm'));
      }
      if (editingTask.scheduledEnd) {
        setScheduledEndDate(new Date(editingTask.scheduledEnd));
        setScheduledEndTime(format(new Date(editingTask.scheduledEnd), 'HH:mm'));
      }
      
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
      form.reset();
      setSelectedMember("unassigned");
      setSelectedMembers([]);
      setDeadlineDate(undefined);
      setTimeInput('09:00');
      setScheduledStartDate(undefined);
      setScheduledEndDate(undefined);
      setScheduledStartTime('');
      setScheduledEndTime('');
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

  const handleScheduledStartDateChange = (date: Date | undefined) => {
    setScheduledStartDate(date);
  };

  const handleScheduledEndDateChange = (date: Date | undefined) => {
    setScheduledEndDate(date);
  };

  const handleScheduledStartTimeChange = (time: string) => {
    setScheduledStartTime(time);
  };

  const handleScheduledEndTimeChange = (time: string) => {
    setScheduledEndTime(time);
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
      const [hours, minutes] = timeInput.split(':');
      const deadline = new Date(deadlineDate);
      deadline.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      let scheduledStart: Date | undefined;
      if (scheduledStartDate) {
        scheduledStart = new Date(scheduledStartDate);
        if (scheduledStartTime) {
          const [startHours, startMinutes] = scheduledStartTime.split(':');
          scheduledStart.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));
        }
      }

      let scheduledEnd: Date | undefined;
      if (scheduledEndDate) {
        scheduledEnd = new Date(scheduledEndDate);
        if (scheduledEndTime) {
          const [endHours, endMinutes] = scheduledEndTime.split(':');
          scheduledEnd.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
        }
      }

      const formData = form.getValues();
      
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
        scheduledStart,
        scheduledEnd,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        projectId: formData.projectId === 'none' ? undefined : formData.projectId,
      };

      const success = await submitTask(
        taskData,
        assignedUsers,
        deadline,
        '',
        editingTask,
        () => {
          devLog.taskOperation('Task submission success callback');
          logger.userAction('Task created/updated successfully');
          onOpenChange(false);
          onTaskComplete?.();
        }
      );

      if (!success) {
        logger.error('Task submission failed');
        throw new Error('Failed to submit task');
      }

      devLog.taskOperation('Task submission completed successfully');
    } catch (error) {
      logger.error('Error in handleSubmit', error);
      toast.error('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm mx-4 sm:mx-auto sm:max-w-2xl h-[90vh] p-0 gap-0 scrollbar-hide overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <MobileTaskForm
              form={form}
              projects={projects}
              users={users}
              loadingUsers={loadingUsers}
              selectedMember={selectedMember}
              selectedMembers={selectedMembers}
              deadlineDate={deadlineDate}
              timeInput={timeInput}
              scheduledStartDate={scheduledStartDate}
              scheduledEndDate={scheduledEndDate}
              scheduledStartTime={scheduledStartTime}
              scheduledEndTime={scheduledEndTime}
              onAssign={handleAssign}
              onMembersChange={handleMembersChange}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              onScheduledStartDateChange={handleScheduledStartDateChange}
              onScheduledEndDateChange={handleScheduledEndDateChange}
              onScheduledStartTimeChange={handleScheduledStartTimeChange}
              onScheduledEndTimeChange={handleScheduledEndTimeChange}
              editingTask={editingTask}
            />
          </div>

          <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
            <TaskDialogActions
              isSubmitting={isSubmitting}
              editingTask={editingTask}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateTaskDialog;
