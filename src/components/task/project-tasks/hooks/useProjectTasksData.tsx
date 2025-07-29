
import { useMemo, useCallback } from 'react';
import { Task } from '@/types';

export const useProjectTasksData = (tasks: Task[], searchQuery: string = '', sortBy: string = 'deadline') => {
  // Filter tasks first
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [tasks, searchQuery]);

  // Sort function to apply within each status category
  const sortTasks = useCallback((tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
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
  }, [sortBy]);

  // Task categorization and sorting within each category
  const { todoTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    // First categorize the filtered tasks
    filteredTasks.forEach(task => {
      if (task.status === 'To Do') {
        todo.push(task);
      } else if (task.status === 'In Progress') {
        inProgress.push(task);
      } else if (task.status === 'Completed') {
        completed.push(task);
      }
    });

    // Then sort within each category
    return {
      todoTasks: sortTasks(todo),
      inProgressTasks: sortTasks(inProgress),
      completedTasks: sortTasks(completed)
    };
  }, [filteredTasks, sortTasks]);

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
