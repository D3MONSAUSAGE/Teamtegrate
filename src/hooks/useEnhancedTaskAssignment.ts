import { useState, useEffect } from 'react';
import { User, Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedTaskAssignmentService, AssignmentOptions } from '@/services/EnhancedTaskAssignmentService';
import { toast } from '@/components/ui/sonner';

interface UseEnhancedTaskAssignmentProps {
  task?: Task;
  users: User[];
  organizationId: string;
  onAssignmentComplete?: () => void;
}

export const useEnhancedTaskAssignment = ({
  task,
  users,
  organizationId,
  onAssignmentComplete
}: UseEnhancedTaskAssignmentProps) => {
  const { user: currentUser } = useAuth();
  const [assignmentType, setAssignmentType] = useState<'individual' | 'multiple' | 'team'>('individual');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize state based on existing task assignment
  useEffect(() => {
    if (task) {
      if (task.assignedToTeamId) {
        setAssignmentType('team');
        setSelectedTeamId(task.assignedToTeamId);
        setSelectedTeamName(task.assignedToTeamName || '');
        setSelectedUserIds([]);
      } else if (task.assignedToIds && task.assignedToIds.length > 1) {
        setAssignmentType('multiple');
        setSelectedUserIds(task.assignedToIds);
        setSelectedTeamId('');
        setSelectedTeamName('');
      } else if (task.assignedToId) {
        setAssignmentType('individual');
        setSelectedUserIds([task.assignedToId]);
        setSelectedTeamId('');
        setSelectedTeamName('');
      } else {
        setAssignmentType('individual');
        setSelectedUserIds([]);
        setSelectedTeamId('');
        setSelectedTeamName('');
      }
    }
  }, [task]);

  const getSelectedUsers = (): User[] => {
    return users.filter(user => selectedUserIds.includes(user.id));
  };

  const assignTask = async (): Promise<boolean> => {
    if (!task || !currentUser) return false;

    setIsProcessing(true);
    try {
      const selectedUsers = getSelectedUsers();
      const userNames = selectedUsers.map(u => u.name || u.email);
      
      const options: AssignmentOptions = {
        taskId: task.id,
        assignmentType: assignmentType === 'team' ? 'team' : (selectedUserIds.length > 1 ? 'multiple' : 'individual'),
        assignmentSource: 'manual',
        userIds: assignmentType === 'team' ? undefined : selectedUserIds,
        userNames: assignmentType === 'team' ? undefined : userNames,
        teamId: assignmentType === 'team' ? selectedTeamId : undefined,
        teamName: assignmentType === 'team' ? selectedTeamName : undefined,
        organizationId,
        assignedBy: currentUser.id,
        notes: `Manual assignment by ${currentUser.name || currentUser.email}`
      };

      const success = await EnhancedTaskAssignmentService.assignTask(options);
      
      if (success && onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      return success;
    } catch (error) {
      toast.error('Failed to assign task');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    assignmentType,
    selectedUserIds,
    selectedTeamId,
    selectedTeamName,
    isProcessing,
    selectedUsers: getSelectedUsers(),
    assignTask,
    setAssignmentType,
    setSelectedUserIds,
    setSelectedTeamId,
    setSelectedTeamName
  };
};