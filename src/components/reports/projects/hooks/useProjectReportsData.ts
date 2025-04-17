
import React from 'react';
import { useTask } from '@/contexts/task';
import { isAfter } from 'date-fns';
import { ProjectStatusData, ProjectTaskStatusData, CompletionData } from '../../types';

export const useProjectReportsData = () => {
  const { projects } = useTask();
  
  // Project completion status
  const projectStatus = React.useMemo<ProjectStatusData[]>(() => {
    if (projects.length === 0) return [];
    
    const dataMap = new Map();
    projects.forEach(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Today's date
      const now = new Date();
      // Check if project is overdue
      const isOverdue = project.endDate && isAfter(now, new Date(project.endDate));
      
      dataMap.set(project.title, {
        name: project.title,
        total: totalTasks,
        completed: completedTasks,
        completionRate,
        isOverdue
      });
    });
    
    return Array.from(dataMap.values());
  }, [projects]);
  
  // Project tasks by status
  const projectTasksByStatus = React.useMemo<ProjectTaskStatusData[]>(() => {
    if (projects.length === 0) return [];
    
    return projects.slice(0, 5).map(project => {
      const statusCounts = {
        'To Do': 0,
        'In Progress': 0,
        'Pending': 0,
        'Completed': 0
      };
      
      project.tasks.forEach(task => {
        statusCounts[task.status]++;
      });
      
      return {
        name: project.title.length > 10 ? project.title.substring(0, 10) + '...' : project.title,
        ...statusCounts
      };
    });
  }, [projects]);
  
  // Project on-time completion rate
  const onTimeCompletionData = React.useMemo<CompletionData[]>(() => {
    const onTime = projects.filter(project => {
      if (!project.endDate) return false;
      
      const completedTasks = project.tasks.filter(task => task.status === 'Completed');
      const allTasksCompleted = completedTasks.length === project.tasks.length;
      
      const endDate = new Date(project.endDate);
      const now = new Date();
      
      return allTasksCompleted && !isAfter(now, endDate);
    }).length;
    
    const overdue = projects.filter(project => {
      if (!project.endDate) return false;
      
      const endDate = new Date(project.endDate);
      const now = new Date();
      
      return isAfter(now, endDate);
    }).length;
    
    const inProgress = projects.length - onTime - overdue;
    
    return [
      { name: 'On Time', value: onTime },
      { name: 'In Progress', value: inProgress },
      { name: 'Overdue', value: overdue }
    ];
  }, [projects]);

  return {
    projectStatus,
    projectTasksByStatus,
    onTimeCompletionData
  };
};
