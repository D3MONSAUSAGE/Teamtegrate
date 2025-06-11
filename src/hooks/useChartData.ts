
import { useMemo } from 'react';
import { Task, Project } from '@/types';

export const useChartData = (tasks: Task[], projects: Project[]) => {
  const chartData = useMemo(() => {
    return projects.map(project => {
      // Get tasks for this project from the tasks array
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'Completed');
      
      return {
        name: project.title,
        completed: completedTasks.length,
        total: projectTasks.length,
        progress: projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0
      };
    });
  }, [tasks, projects]);

  return { chartData };
};
