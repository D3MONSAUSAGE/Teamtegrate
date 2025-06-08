
import { useState, useMemo, useCallback } from 'react';
import { Task } from '@/types';

export const useProjectTasksFilters = (projectTasks: Task[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = projectTasks;
    
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [projectTasks, searchQuery, sortBy]);

  // Group tasks by status
  const todoTasks = useMemo(() => filteredTasks.filter(task => task.status === 'To Do'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(task => task.status === 'In Progress'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(task => task.status === 'Completed'), [filteredTasks]);

  // Calculate progress
  const progress = useMemo(() => {
    const totalTasks = projectTasks.length;
    const completed = completedTasks.length;
    return totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  }, [projectTasks.length, completedTasks.length]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const onSortByChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  return {
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    completedTasks,
    progress,
    handleSearchChange,
    onSortByChange
  };
};
