
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { useState, useMemo } from 'react';

export function useTaskTabs() {
  const { tasks } = useTask();
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created'>('deadline');

  const filtered = useMemo(() => ({
    'To Do': tasks.filter(t => t.status === 'To Do'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    'Pending': tasks.filter(t => t.status === 'Pending'),
    'Completed': tasks.filter(t => t.status === 'Completed'),
  }), [tasks]);

  const sortTasks = (arr: Task[]) => {
    return [...arr].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority': {
          const priorityValues = { High: 0, Medium: 1, Low: 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        }
        case 'created':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });
  };

  return {
    sortBy,
    setSortBy,
    todo: sortTasks(filtered['To Do']),
    inprogress: sortTasks(filtered['In Progress']),
    pending: sortTasks(filtered['Pending']),
    completed: sortTasks(filtered['Completed']),
    counts: {
      todo: filtered['To Do'].length,
      inprogress: filtered['In Progress'].length,
      pending: filtered['Pending'].length,
      completed: filtered['Completed'].length,
    },
  };
}
