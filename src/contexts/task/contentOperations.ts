import { Task, Project, TaskComment } from '@/types';
import { toast } from '@/components/ui/sonner';

export const addCommentToTask = (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newComment: TaskComment = {
    ...comment,
    id: Math.random().toString(36).substring(2, 11),
    taskId,
    createdAt: new Date(),
  };

  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      const comments = task.comments || [];
      return { 
        ...task, 
        comments: [...comments, newComment],
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
          if (task.id === taskId) {
            const comments = task.comments || [];
            return { 
              ...task, 
              comments: [...comments, newComment],
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
  
  toast.success('Comment added successfully!');
};

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

export const addTagToProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId) {
      const tags = project.tags || [];
      if (!tags.includes(tag)) {
        return { 
          ...project, 
          tags: [...tags, tag],
          updatedAt: new Date() 
        };
      }
    }
    return project;
  });

  setProjects(updatedProjects);
  toast.success('Tag added to project successfully!');
};

export const removeTagFromProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const updatedProjects = projects.map((project) => {
    if (project.id === projectId && project.tags) {
      return { 
        ...project, 
        tags: project.tags.filter(t => t !== tag),
        updatedAt: new Date() 
      };
    }
    return project;
  });

  setProjects(updatedProjects);
  toast.success('Tag removed from project successfully!');
};
