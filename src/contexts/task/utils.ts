
import { Project, Task } from '@/types';

/**
 * Updates a task within the projects state
 * @param projects Current projects array
 * @param setProjects setState function for projects
 * @param taskId ID of the task to update
 * @param updates Object containing properties to update
 */
export const updateTaskInProjects = (
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  taskId: string,
  updates: Partial<Task>
) => {
  setProjects(prevProjects => 
    prevProjects.map(project => {
      // Skip projects with no tasks or tasks array
      if (!project.tasks || project.tasks.length === 0) {
        return project;
      }
      
      // Check if the task is in this project
      const taskIndex = project.tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        return project;
      }
      
      // Clone the tasks array and update the specific task
      const updatedTasks = [...project.tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...updates
      };
      
      // Return updated project with the modified tasks
      return {
        ...project,
        tasks: updatedTasks
      };
    })
  );
};
