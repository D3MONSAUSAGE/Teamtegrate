
import { useState, useMemo } from 'react';
import { Task } from '@/types';

export const useProjectViewState = (tasks: Task[]) => {
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'board' | 'list'>('compact');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>();
  const [showCompleted, setShowCompleted] = useState(true);
  const [showOverview, setShowOverview] = useState(true);

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

      // Filter by completion status
      if (!showCompleted && task.status === 'Completed') {
        return false;
      }

      return true;
    });
  }, [tasks, selectedAssignee, selectedPriority, showCompleted]);

  const handleAssigneeFilter = (assigneeId: string | undefined) => {
    setSelectedAssignee(assigneeId);
  };

  const handlePriorityFilter = (priority: string | undefined) => {
    setSelectedPriority(priority);
  };

  const toggleCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  const toggleOverview = () => {
    setShowOverview(!showOverview);
  };

  const clearFilters = () => {
    setSelectedAssignee(undefined);
    setSelectedPriority(undefined);
    setShowCompleted(true);
  };

  return {
    viewMode,
    setViewMode,
    filteredTasks,
    selectedAssignee,
    selectedPriority,
    showCompleted,
    showOverview,
    handleAssigneeFilter,
    handlePriorityFilter,
    toggleCompleted,
    toggleOverview,
    clearFilters
  };
};
