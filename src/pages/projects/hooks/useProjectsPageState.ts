
import { useState, useMemo } from 'react';
import { Project } from '@/types';

export const useProjectsPageState = (projects: Project[]) => {
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>();
  const [showCompleted, setShowCompleted] = useState(true);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Filter by status
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }

      // Filter by team member
      if (selectedAssignee) {
        const isTeamMember = project.teamMemberIds?.includes(selectedAssignee) || 
                           project.managerId === selectedAssignee;
        if (!isTeamMember) return false;
      }

      // Filter by completion status
      if (!showCompleted && project.status === 'Completed') {
        return false;
      }

      return true;
    });

    // Sort projects
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'deadline':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress':
          const progressA = a.tasksCount > 0 ? (a.isCompleted ? 100 : 50) : 0;
          const progressB = b.tasksCount > 0 ? (b.isCompleted ? 100 : 50) : 0;
          return progressB - progressA;
        default:
          return 0;
      }
    });
  }, [projects, statusFilter, selectedAssignee, showCompleted, sortBy]);

  const handleAssigneeFilter = (assigneeId: string | undefined) => {
    setSelectedAssignee(assigneeId);
  };

  const toggleCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  return {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    selectedAssignee,
    handleAssigneeFilter,
    showCompleted,
    toggleCompleted,
    filteredAndSortedProjects
  };
};
