
import { Task, Project, Comment } from '@/types';
import { toast } from '@/components/ui/sonner';

export const addCommentToTask = (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newComment: Comment = {
    ...comment,
    id: Math.random().toString(36).substring(2, 11),
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
