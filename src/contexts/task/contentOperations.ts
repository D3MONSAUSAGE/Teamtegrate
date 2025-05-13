
import { Task, Project } from '@/types';

// Add a comment to a task
export const addCommentToTask = (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newTasks = tasks.map(task => {
    if (task.id === taskId) {
      const newComments = [...(task.comments || []), {
        id: `comment-${Date.now()}`,
        userId: comment.userId,
        userName: comment.userName,
        text: comment.text,
        createdAt: new Date()
      }];
      
      return { ...task, comments: newComments };
    }
    return task;
  });
  
  setTasks(newTasks);
  
  // Update tasks in projects if needed
  const newProjects = projects.map(project => {
    if (project.tasks && project.tasks.some(task => task.id === taskId)) {
      return {
        ...project,
        tasks: project.tasks.map(task => {
          if (task.id === taskId) {
            const newComments = [...(task.comments || []), {
              id: `comment-${Date.now()}`,
              userId: comment.userId,
              userName: comment.userName,
              text: comment.text,
              createdAt: new Date()
            }];
            
            return { ...task, comments: newComments };
          }
          return task;
        })
      };
    }
    return project;
  });
  
  setProjects(newProjects);
};

// Add a tag to a task
export const addTagToTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newTasks = tasks.map(task => {
    if (task.id === taskId) {
      const currentTags = task.tags || [];
      if (currentTags.includes(tag)) return task;
      
      return { ...task, tags: [...currentTags, tag] };
    }
    return task;
  });
  
  setTasks(newTasks);
  
  // Update tasks in projects if needed
  const newProjects = projects.map(project => {
    if (project.tasks && project.tasks.some(task => task.id === taskId)) {
      return {
        ...project,
        tasks: project.tasks.map(task => {
          if (task.id === taskId) {
            const currentTags = task.tags || [];
            if (currentTags.includes(tag)) return task;
            
            return { ...task, tags: [...currentTags, tag] };
          }
          return task;
        })
      };
    }
    return project;
  });
  
  setProjects(newProjects);
};

// Remove a tag from a task
export const removeTagFromTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newTasks = tasks.map(task => {
    if (task.id === taskId && task.tags) {
      return { ...task, tags: task.tags.filter(t => t !== tag) };
    }
    return task;
  });
  
  setTasks(newTasks);
  
  // Update tasks in projects if needed
  const newProjects = projects.map(project => {
    if (project.tasks && project.tasks.some(task => task.id === taskId)) {
      return {
        ...project,
        tasks: project.tasks.map(task => {
          if (task.id === taskId && task.tags) {
            return { ...task, tags: task.tags.filter(t => t !== tag) };
          }
          return task;
        })
      };
    }
    return project;
  });
  
  setProjects(newProjects);
};

// Add a tag to a project
export const addTagToProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newProjects = projects.map(project => {
    if (project.id === projectId) {
      const currentTags = project.tags || [];
      if (currentTags.includes(tag)) return project;
      
      return { ...project, tags: [...currentTags, tag] };
    }
    return project;
  });
  
  setProjects(newProjects);
};

// Remove a tag from a project
export const removeTagFromProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newProjects = projects.map(project => {
    if (project.id === projectId && project.tags) {
      return { ...project, tags: project.tags.filter(t => t !== tag) };
    }
    return project;
  });
  
  setProjects(newProjects);
};
