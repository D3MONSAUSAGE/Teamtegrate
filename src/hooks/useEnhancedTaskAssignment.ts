
import { useState, useEffect } from 'react';
import { User, Task } from '@/types';
import { toast } from '@/components/ui/sonner';

interface UseEnhancedTaskAssignmentProps {
  editingTask?: Task;
  users: User[];
}

export const useEnhancedTaskAssignment = ({ editingTask, users }: UseEnhancedTaskAssignmentProps) => {
  const [selectedMember, setSelectedMember] = useState<string | undefined>("unassigned");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [multiAssignMode, setMultiAssignMode] = useState(false);

  // Initialize assignment state based on editing task
  useEffect(() => {
    if (editingTask) {
      const hasMultipleAssignees = editingTask.assignedToIds && editingTask.assignedToIds.length > 1;
      
      setMultiAssignMode(hasMultipleAssignees);
      
      if (editingTask.assignedToIds && editingTask.assignedToIds.length > 0) {
        setSelectedMembers(editingTask.assignedToIds);
        if (editingTask.assignedToIds.length === 1) {
          setSelectedMember(editingTask.assignedToIds[0]);
        }
      } else if (editingTask.assignedToId) {
        setSelectedMember(editingTask.assignedToId);
        setSelectedMembers([editingTask.assignedToId]);
      }
    } else {
      // Reset for new task
      setSelectedMember("unassigned");
      setSelectedMembers([]);
      setMultiAssignMode(false);
    }
  }, [editingTask]);

  const handleAssignmentToggle = (enabled: boolean) => {
    setMultiAssignMode(enabled);
    
    if (enabled) {
      // Switch to multi-assign mode
      if (selectedMember && selectedMember !== "unassigned") {
        setSelectedMembers([selectedMember]);
      }
      setSelectedMember("unassigned");
    } else {
      // Switch to single assign mode
      if (selectedMembers.length > 0) {
        setSelectedMember(selectedMembers[0]);
        setSelectedMembers([]);
      }
    }
  };

  const handleSingleAssign = (userId: string) => {
    setSelectedMember(userId);
    // Clear multi-assignment when single assigning
    if (multiAssignMode) {
      setSelectedMembers(userId === "unassigned" ? [] : [userId]);
    }
  };

  const handleMultipleAssign = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
    // Update single assignment for consistency
    if (memberIds.length === 1) {
      setSelectedMember(memberIds[0]);
    } else if (memberIds.length === 0) {
      setSelectedMember("unassigned");
    }
  };

  const getAssignedUsers = (): User[] => {
    if (multiAssignMode) {
      return users.filter(user => selectedMembers.includes(user.id));
    } else if (selectedMember && selectedMember !== "unassigned") {
      const user = users.find(u => u.id === selectedMember);
      return user ? [user] : [];
    }
    return [];
  };

  const validateAssignment = (): boolean => {
    if (multiAssignMode && selectedMembers.length === 0) {
      toast.error('Please assign at least one team member for collaborative tasks');
      return false;
    }
    return true;
  };

  const getAssignmentSummary = (): string => {
    const assignedUsers = getAssignedUsers();
    if (assignedUsers.length === 0) return 'Unassigned';
    if (assignedUsers.length === 1) return assignedUsers[0].name || assignedUsers[0].email;
    if (assignedUsers.length <= 3) {
      return assignedUsers.map(u => u.name || u.email).join(', ');
    }
    return `${assignedUsers[0].name || assignedUsers[0].email} and ${assignedUsers.length - 1} others`;
  };

  return {
    selectedMember,
    selectedMembers,
    multiAssignMode,
    handleAssignmentToggle,
    handleSingleAssign,
    handleMultipleAssign,
    getAssignedUsers,
    validateAssignment,
    getAssignmentSummary
  };
};
