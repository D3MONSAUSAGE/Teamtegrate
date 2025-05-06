
import { Task, Project } from '@/types';
import { format } from 'date-fns';

/**
 * Updates the tasks state and project state with a newly created task
 */
export const updateStateWithNewTask = (
  newTask: Task,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): void => {
  console.log('Updating state with new task:', newTask.title);
  
  if (newTask.deadline) {
    console.log('Task deadline:', format(newTask.deadline, 'yyyy-MM-dd'));
  }
  
  // Log project assignment for debugging
  if (newTask.projectId) {
    console.log(`Task assigned to project ID: ${newTask.projectId}`);
  } else {
    console.log('Task not assigned to any project');
  }
  
  // Update the tasks state with the new task
  setTasks(prevTasks => {
    const updatedTasks = [...prevTasks, newTask];
    console.log(`Tasks updated: ${updatedTasks.length} (previous: ${prevTasks.length})`);
    return updatedTasks;
  });
  
  // Update the project's tasks if needed
  if (newTask.projectId) {
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(project => {
        if (project.id === newTask.projectId) {
          console.log(`Adding task "${newTask.title}" to project "${project.title}"`);
          
          // Make sure project.tasks exists before trying to spread it
          const currentTasks = project.tasks || [];
          
          return {
            ...project,
            tasks: [...currentTasks, newTask],
            tasks_count: (project.tasks_count || 0) + 1
          };
        }
        return project;
      });
      
      // Check if we found and updated the project
      const projectFound = updatedProjects.some(p => p.id === newTask.projectId);
      if (!projectFound) {
        console.warn(`Project with ID ${newTask.projectId} not found in state when adding task "${newTask.title}"`);
      }
      
      return updatedProjects;
    });
  }
};
