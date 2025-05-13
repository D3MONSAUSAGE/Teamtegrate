
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
  
  // Update the tasks state with the new task
  setTasks(prevTasks => {
    const updatedTasks = [...prevTasks, newTask];
    console.log(`Tasks updated: ${updatedTasks.length} (previous: ${prevTasks.length})`);
    return updatedTasks;
  });
  
  // Update the project's tasks if needed
  if (newTask.projectId) {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === newTask.projectId) {
          console.log(`Adding task to project ${project.title}`);
          return {
            ...project,
            tasks: [...(project.tasks || []), newTask],
            tasks_count: (project.tasks_count || 0) + 1
          };
        }
        return project;
      })
    );
  }
};
