
import { Task } from '@/types';

export const logTaskFetchResults = (tasks: Task[]): void => {
  // Add additional logging for task count by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.projectId || 'unassigned';
    acc[projectId] = (acc[projectId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`Final task count being set: ${tasks.length}`);
  console.log('Tasks by project:', tasksByProject);
  console.log('Tasks by status:', 
    tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );
};
