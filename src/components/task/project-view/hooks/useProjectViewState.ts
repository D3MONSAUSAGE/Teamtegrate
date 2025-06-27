
import { useState, useMemo } from 'react';
import { Task } from '@/types';

export const useProjectViewState = (tasks: Task[]) => {
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'board' | 'list'>('compact');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by assignee
      if (selectedAssignee) {
        const isAssigned = task.assignedToId === selectedAssignee || 
                          task.assignedToIds?.includes(selectedAssignee);
        if (!isAssigned) return false;
      }

      // Filter by priority
      if (selectedPriority && task.priority !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [tasks, selectedAssignee, selectedPriority]);

  const handleAssigneeFilter = (assigneeId: string | undefined) => {
    setSelectedAssignee(assigneeId);
  };

  const handlePriorityFilter = (priority: string | undefined) => {
    setSelectedPriority(priority);
  };

  const clearFilters = () => {
    setSelectedAssignee(undefined);
    setSelectedPriority(undefined);
  };

  return {
    viewMode,
    setViewMode,
    filteredTasks,
    selectedAssignee,
    selectedPriority,
    handleAssigneeFilter,
    handlePriorityFilter,
    clearFilters
  };
};
