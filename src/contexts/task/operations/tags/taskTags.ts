
import { Task, Project, ProjectTask } from '@/types';
import { toast } from '@/components/ui/sonner';

export const addTagToTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      const tags = task.tags || [];
      if (!tags.includes(tag)) {
        return { 
          ...task, 
          tags: [...tags, tag],
          updatedAt: new Date() 
        };
      }
    }
    return task;
  });

  setTasks(updatedTasks);
  
  const taskToUpdate = tasks.find(task => task.id === taskId);
  if (taskToUpdate?.projectId) {
    const updatedProjects = projects.map((project) => {
      if (project.id === taskToUpdate.projectId) {
        const projectTasks = project.tasks.map((task) => {
          if (task.id === taskId) {
            // Ensure tags exist on the ProjectTask
            const tags = task.tags || [];
            if (!tags.includes(tag)) {
              return { 
                ...task, 
                tags: [...tags, tag],
                updatedAt: new Date() 
              };
            }
          }
          return task;
        });
        
        return { ...project, tasks: projectTasks };
      }
      return project;
    });
    
    setProjects(updatedProjects);
  }
  
  toast.success('Tag added to task successfully!');
};

export const removeTagFromTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId && task.tags) {
      return { 
        ...task, 
        tags: task.tags.filter(t => t !== tag),
        updatedAt: new Date() 
      };
    }
    return task;
  });

  setTasks(updatedTasks);
  
  const taskToUpdate = tasks.find(task => task.id === taskId);
  if (taskToUpdate?.projectId) {
    const updatedProjects = projects.map((project) => {
      if (project.id === taskToUpdate.projectId) {
        const projectTasks = project.tasks.map((task) => {
          if (task.id === taskId && task.tags) {
            return { 
              ...task, 
              tags: task.tags.filter(t => t !== tag),
              updatedAt: new Date() 
            };
          }
          return task;
        });
        
        return { ...project, tasks: projectTasks };
      }
      return project;
    });
    
    setProjects(updatedProjects);
  }
  
  toast.success('Tag removed from task successfully!');
};
