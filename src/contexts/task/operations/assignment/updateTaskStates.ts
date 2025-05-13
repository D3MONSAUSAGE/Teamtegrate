
import { Task } from '@/types';

/**
 * Update the task states in both tasks array and projects array
 */
export const updateTaskStates = (
  taskId: string,
  userId: string | undefined,
  userName: string | undefined,
  projectId: string | undefined,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): void => {
  const now = new Date();
  
  // Update the task in the tasks array
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId) {
      console.log('Updating task in tasks array', { 
        taskId, 
        userId, 
        userName,
        before: task.assignedToName || 'none',
        after: userName || 'none'
      });
      return { 
        ...task, 
        assignedToId: userId, 
        assignedToName: userName, 
        updatedAt: now 
      };
    }
    return task;
  }));
  
  // Also update the task in the project if needed
  if (projectId) {
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map(projectTask => {
              if (projectTask.id === taskId) {
                console.log('Updating task in project', {
                  projectId,
                  taskId,
                  userId,
                  userName,
                  before: projectTask.assignedToName || 'none',
                  after: userName || 'none'
                });
                return { 
                  ...projectTask, 
                  assignedToId: userId, 
                  assignedToName: userName,
                  updatedAt: now
                };
              }
              return projectTask;
            })
          };
        }
        return project;
      });
    });
  }
};
