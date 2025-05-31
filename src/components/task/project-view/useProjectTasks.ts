
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Task } from '@/types';

export const useProjectTasks = (allTasks: Task[], projectId: string | null) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

  // Reset search query when project changes
  useEffect(() => {
    setSearchQuery('');
  }, [projectId]);

  // Filter tasks that belong to the selected project - now we work with projectTasks directly
  const projectTasks = useMemo(() => {
    if (!projectId || !allTasks || allTasks.length === 0) return [];
    
    console.log(`Filtering tasks for project ${projectId}. Total tasks: ${allTasks.length}`);
    // The allTasks parameter should already contain only tasks for this project
    return allTasks; 
  }, [allTasks, projectId]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return projectTasks;
    
    const query = searchQuery.toLowerCase().trim();
    return projectTasks.filter(task => 
      task.title.toLowerCase().includes(query) || 
      (task.description && task.description.toLowerCase().includes(query))
    );
  }, [projectTasks, searchQuery]);

  // Sort tasks function
  const sortTasks = useCallback((tasksToSort: Task[]) => {
    if (!tasksToSort || tasksToSort.length === 0) return [];
    
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
  }, [sortBy]);

  // Group tasks by status - memoized with sortTasks as dependency
  const todoTasks = useMemo(() => 
    sortTasks(filteredTasks.filter(task => task.status === 'To Do')),
    [filteredTasks, sortTasks]
  );
  
  const inProgressTasks = useMemo(() => 
    sortTasks(filteredTasks.filter(task => task.status === 'In Progress')),
    [filteredTasks, sortTasks]
  );
  
  const pendingTasks = useMemo(() => 
    sortTasks(filteredTasks.filter(task => task.status === 'Pending')),
    [filteredTasks, sortTasks]
  );
  
  const completedTasks = useMemo(() => 
    sortTasks(filteredTasks.filter(task => task.status === 'Done')),
    [filteredTasks, sortTasks]
  );

  // Calculate progress - use the same calculation method as ProjectProgressBar
  const progress = useMemo(() => {
    const total = projectTasks.length;
    if (total === 0) return 0;
    
    const completed = projectTasks.filter(task => task.status === 'Done').length;
    return Math.round((completed / total) * 100);
  }, [projectTasks]);

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
