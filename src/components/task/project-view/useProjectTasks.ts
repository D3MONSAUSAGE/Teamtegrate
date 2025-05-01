
import { useState, useMemo } from 'react';
import { Task } from '@/types';

export const useProjectTasks = (allTasks: Task[], projectId: string | null) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

  // Filter tasks that belong to the selected project
  const projectTasks = useMemo(() => {
    return allTasks.filter(task => task.project_id === projectId);
  }, [allTasks, projectId]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return projectTasks;
    
    const query = searchQuery.toLowerCase();
    return projectTasks.filter(task => 
      task.title.toLowerCase().includes(query) || 
      (task.description && task.description.toLowerCase().includes(query))
    );
  }, [projectTasks, searchQuery]);

  // Sort tasks
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'upcoming':
          const now = new Date().getTime();
          const deadlineA = new Date(a.deadline).getTime();
          const deadlineB = new Date(b.deadline).getTime();
          const timeToDeadlineA = deadlineA - now;
          const timeToDeadlineB = deadlineB - now;
          const upcomingA = timeToDeadlineA > 0 ? timeToDeadlineA : Number.MAX_SAFE_INTEGER;
          const upcomingB = timeToDeadlineB > 0 ? timeToDeadlineB : Number.MAX_SAFE_INTEGER;
          return upcomingA - upcomingB;
        default:
          return 0;
      }
    });
  };

  // Group tasks by status
  const todoTasks = sortTasks(filteredTasks.filter(task => task.status === 'To Do'));
  const inProgressTasks = sortTasks(filteredTasks.filter(task => task.status === 'In Progress'));
  const pendingTasks = sortTasks(filteredTasks.filter(task => task.status === 'Pending'));
  const completedTasks = sortTasks(filteredTasks.filter(task => task.status === 'Completed'));

  // Calculate progress
  const progress = useMemo(() => {
    const total = filteredTasks.length;
    if (total === 0) return 0;
    
    const completed = filteredTasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / total) * 100);
  }, [filteredTasks]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
    projectTasks
  };
};
