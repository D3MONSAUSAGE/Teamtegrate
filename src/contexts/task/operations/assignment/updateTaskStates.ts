
import { Task } from '@/types';

export const updateTaskStates = (
  taskId: string,
  userId: string,
  userName: string,
  projectId: string | undefined,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<any[]>> | (() => Promise<void>)
) => {
  // Update tasks state
  setTasks(prevTasks =>
    prevTasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            assignedToId: userId,
            assignedToName: userName,
            updatedAt: new Date()
          }
        : task
    )
  );

  // Update projects state if the task belongs to a project
  if (projectId && typeof setProjects === 'function' && setProjects.length > 0) {
    setProjects((prevProjects: any[]) =>
      prevProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task: Task) =>
                task.id === taskId
                  ? {
                      ...task,
                      assignedToId: userId,
                      assignedToName: userName,
                      updatedAt: new Date()
                    }
                  : task
              ),
            }
          : project
      )
    );
  } else if (typeof setProjects === 'function' && setProjects.length === 0) {
    // It's a refresh function - call it asynchronously
    setProjects().catch(error => console.error('Error refreshing projects:', error));
  }
};
