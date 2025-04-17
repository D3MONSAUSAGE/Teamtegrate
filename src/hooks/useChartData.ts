
import { useMemo } from 'react';
import { Task, Project } from '@/types';
import { sub, format } from 'date-fns';

export const useCompletionRateData = (tasks: Task[], days: number = 7) => {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = sub(today, { days: i });
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'EEE');
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });
      
      const completed = dayTasks.filter(task => task.status === 'Completed').length;
      const all = dayTasks.length;
      const rate = all > 0 ? Math.round((completed / all) * 100) : 0;
      
      data.push({
        date: displayDate,
        completed,
        all,
        rate,
      });
    }
    
    return data;
  }, [tasks, days]);
};

export const useTeamPerformanceData = (tasks: Task[]) => {
  return useMemo(() => {
    const assignedTasks = tasks.filter(task => task.assignedToId);
    
    const groupedByAssignee = assignedTasks.reduce((acc, task) => {
      const assigneeName = task.assignedToName || 'Unassigned';
      if (!acc[assigneeName]) {
        acc[assigneeName] = {
          total: 0,
          completed: 0
        };
      }
      
      acc[assigneeName].total++;
      if (task.status === 'Completed') {
        acc[assigneeName].completed++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);
    
    return Object.entries(groupedByAssignee).map(([name, data]) => ({
      name,
      completed: data.completed,
      total: data.total,
    }));
  }, [tasks]);
};

export const useProjectProgressData = (projects: Project[]) => {
  return useMemo(() => {
    return projects
      .filter(project => project.tasks && project.tasks.length > 0)
      .map(project => {
        const tasksByStatus = project.tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          name: project.title,
          'To Do': tasksByStatus['To Do'] || 0,
          'In Progress': tasksByStatus['In Progress'] || 0,
          'Pending': tasksByStatus['Pending'] || 0,
          'Completed': tasksByStatus['Completed'] || 0
        };
      });
  }, [projects]);
};
