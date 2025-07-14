
import { useMemo } from 'react';
import { Task } from '@/types';

export const useProjectTasksData = (tasks: Task[]) => {
  // Task categorization
  const { todoTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach(task => {
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
  }, [tasks]);

  // Calculate progress
  const progress = useMemo(() => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks.length / totalTasks) * 100);
  }, [tasks.length, completedTasks.length]);

  return {
    todoTasks,
    inProgressTasks,
    completedTasks,
    progress
  };
};
