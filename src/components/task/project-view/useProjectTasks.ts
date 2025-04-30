
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { useTask } from '@/contexts/task';

export const useProjectTasks = (tasks: Task[], projectId: string | null) => {
  const [sortBy, setSortBy] = useState('deadline');
  const [searchQuery, setSearchQuery] = useState('');
  const { refreshProjects } = useTask();
  
  // Effect to refresh projects data when viewing a specific project
  useEffect(() => {
    if (projectId) {
      console.log(`useProjectTasks: Initializing for project ${projectId}`);
    }
  }, [projectId]);

  // Filter tasks by project and search query
  const projectTasks = tasks.filter((task) => {
    // Make sure to convert the task.projectId to string if needed
    const taskProjectId = typeof task.projectId === 'string' ? task.projectId : String(task.projectId);
    return taskProjectId === projectId;
  }).filter((task) => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Log for debugging
  useEffect(() => {
    if (projectId) {
      console.log(`useProjectTasks: Found ${projectTasks.length} tasks for project ${projectId}`);
    }
  }, [projectId, projectTasks.length]);

  // Filter tasks by status
  const todoTasks = projectTasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = projectTasks.filter((task) => task.status === 'In Progress');
  const pendingTasks = projectTasks.filter((task) => task.status === 'Pending');
  const completedTasks = projectTasks.filter((task) => task.status === 'Completed');

  // Sort tasks based on the selected option
  const sortTasks = useCallback((tasksToSort: Task[]) => {
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
  }, [sortBy]);

  // Sort filtered tasks
  const sortedTodo = sortTasks(todoTasks);
  const sortedInProgress = sortTasks(inProgressTasks);
  const sortedPending = sortTasks(pendingTasks);
  const sortedCompleted = sortTasks(completedTasks);

  // Calculate project progress
  const calculateProgress = useCallback(() => {
    const total = projectTasks.length;
    if (total === 0) return 0;
    
    const completed = completedTasks.length;
    return Math.round((completed / total) * 100);
  }, [projectTasks.length, completedTasks.length]);

  const progress = calculateProgress();

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    todoTasks: sortedTodo,
    inProgressTasks: sortedInProgress,
    pendingTasks: sortedPending,
    completedTasks: sortedCompleted,
    progress,
    projectTasks
  };
};
