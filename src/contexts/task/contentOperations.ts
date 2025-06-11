
// Import your types and dependencies as needed
import { Task, Project, TaskComment } from '@/types';

export const addCommentToTask = (
  taskId: string,
  comment: { userId: string; userName: string; text: string; organizationId: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): void => {
  const updatedTasks = tasks.map(task => {
    if (task.id === taskId) {
      const newComment: TaskComment = {
        id: Date.now().toString(),
        userId: comment.userId,
        userName: comment.userName,
        text: comment.text,
        createdAt: new Date(),
        organizationId: comment.organizationId
      };
      return { ...task, comments: [...(task.comments || []), newComment] };
    }
    return task;
  });
  setTasks(updatedTasks);
};

export const addTagToTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): void => {
  const updatedTasks = tasks.map(task => {
    if (task.id === taskId) {
      if (!task.tags) {
        task.tags = [];
      }
      if (!task.tags.includes(tag)) {
        return { ...task, tags: [...task.tags, tag] };
      }
    }
    return task;
  });
  setTasks(updatedTasks);
};

export const removeTagFromTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): void => {
  const updatedTasks = tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, tags: task.tags ? task.tags.filter(t => t !== tag) : [] };
    }
    return task;
  });
  setTasks(updatedTasks);
};
