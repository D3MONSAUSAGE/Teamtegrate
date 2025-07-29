
import { useMemo } from 'react';
import { Task } from '@/types';

export const useProjectTasksData = (tasks: Task[], searchQuery: string = '', sortBy: string = 'deadline') => {
  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'status':
          const statusValues = { 'To Do': 0, 'In Progress': 1, 'Completed': 2 };
          return statusValues[a.status] - statusValues[b.status];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [tasks, searchQuery, sortBy]);

  // Task categorization from filtered and sorted tasks
  const { todoTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    filteredAndSortedTasks.forEach(task => {
      if (task.status === 'To Do') {
        todo.push(task);
      } else if (task.status === 'In Progress') {
        inProgress.push(task);
      } else if (task.status === 'Completed') {
        completed.push(task);
      }
    });

    return {
      todoTasks: todo,
      inProgressTasks: inProgress,
      completedTasks: completed
    };
  }, [filteredAndSortedTasks]);

  // Calculate progress based on original tasks count (not filtered)
  const progress = useMemo(() => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    const completedCount = tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completedCount / totalTasks) * 100);
  }, [tasks]);

  return {
    todoTasks,
    inProgressTasks,
    completedTasks,
    progress
  };
};
