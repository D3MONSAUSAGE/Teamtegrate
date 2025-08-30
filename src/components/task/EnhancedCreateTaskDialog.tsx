
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target } from 'lucide-react';
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
import TaskDetailsCard from './TaskDetailsCard';
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
  
  // For managers, use organization team members (current behavior)
  // For admins and superadmins, the enhanced assignment component will handle user loading
  const { users, isLoading: loadingUsers, refetch: refetchUsers } = useOrganizationTeamMembers();
  
  const { submitTask } = useTaskSubmission();

  const [selectedMember, setSelectedMember] = useState<string | undefined>("unassigned");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [timeInput, setTimeInput] = useState('09:00');
  
  // New scheduled time states
  const [scheduledStartDate, setScheduledStartDate] = useState<Date | undefined>(undefined);
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>(undefined);
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Warning period state
  const [warningPeriodHours, setWarningPeriodHours] = useState(24);

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
      
      // Set warning period
      setWarningPeriodHours((editingTask as any).warning_period_hours || 24);
      
      setDeadlineDate(new Date(editingTask.deadline));
      setTimeInput(format(new Date(editingTask.deadline), 'HH:mm'));
      
      // Set scheduled times
      if (editingTask.scheduledStart) {
        setScheduledStartDate(new Date(editingTask.scheduledStart));
        setScheduledStartTime(format(new Date(editingTask.scheduledStart), 'HH:mm'));
      }
      if (editingTask.scheduledEnd) {
        setScheduledEndDate(new Date(editingTask.scheduledEnd));
        setScheduledEndTime(format(new Date(editingTask.scheduledEnd), 'HH:mm'));
      }
      
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

  // Scheduled time handlers
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
      // Combine date and time for deadline
      const [hours, minutes] = timeInput.split(':');
      const deadline = new Date(deadlineDate);
      deadline.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      // Combine scheduled start date and time if provided
      let scheduledStart: Date | undefined;
      if (scheduledStartDate) {
        scheduledStart = new Date(scheduledStartDate);
        if (scheduledStartTime) {
          const [startHours, startMinutes] = scheduledStartTime.split(':');
          scheduledStart.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));
        }
      }

      // Combine scheduled end date and time if provided
      let scheduledEnd: Date | undefined;
      if (scheduledEndDate) {
        scheduledEnd = new Date(scheduledEndDate);
        if (scheduledEndTime) {
          const [endHours, endMinutes] = scheduledEndTime.split(':');
          scheduledEnd.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
        }
      }

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
        scheduledStart,
        scheduledEnd,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        projectId: formData.projectId === 'none' ? undefined : formData.projectId,
        warning_period_hours: warningPeriodHours,
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
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {editingTask ? 'Edit Task' : 'Create New Task'}
            {currentUser?.role && (
              <span className="text-sm text-muted-foreground">
                ({currentUser.role} view)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          <div className="lg:col-span-2 space-y-6">
            <TaskDetailsCard
              form={form}
              projects={projects}
              deadlineDate={deadlineDate}
              timeInput={timeInput}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              warningPeriodHours={warningPeriodHours}
              onWarningPeriodChange={setWarningPeriodHours}
            />
            
            <TaskScheduleSection
              scheduledStartDate={scheduledStartDate}
              scheduledEndDate={scheduledEndDate}
              scheduledStartTime={scheduledStartTime}
              scheduledEndTime={scheduledEndTime}
              onScheduledStartDateChange={handleScheduledStartDateChange}
              onScheduledEndDateChange={handleScheduledEndDateChange}
              onScheduledStartTimeChange={handleScheduledStartTimeChange}
              onScheduledEndTimeChange={handleScheduledEndTimeChange}
            />
          </div>
          
          <div className="lg:col-span-1">
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
