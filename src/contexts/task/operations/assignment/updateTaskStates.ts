
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
  
  // Ensure taskId is normalized as a string
  const normalizedTaskId = String(taskId);
  
  console.log('Updating task states with:', {
    taskId: normalizedTaskId,
    userId,
    userName,
    projectId
  });
  
  // Update the task in the tasks array
  setTasks(prevTasks => prevTasks.map(task => {
    if (String(task.id) === normalizedTaskId) {
      console.log('Updating task assignment in tasks array:', {
        taskId: normalizedTaskId,
        before: {
          assignedToId: task.assignedToId,
          assignedToName: task.assignedToName
        },
        after: {
          assignedToId: userId,
          assignedToName: userName
        }
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
        if (project.id === projectId && Array.isArray(project.tasks)) {
          return {
            ...project,
            tasks: project.tasks.map(projectTask => {
              if (String(projectTask.id) === normalizedTaskId) {
                console.log('Updating task assignment in project:', {
                  projectId,
                  taskId: normalizedTaskId,
                  before: {
                    assignedToId: projectTask.assignedToId,
                    assignedToName: projectTask.assignedToName
                  },
                  after: {
                    assignedToId: userId,
                    assignedToName: userName
                  }
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
