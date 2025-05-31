
import { Task, Project, TaskComment } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const addCommentToTask = (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const newComment: TaskComment = {
    id: uuidv4(),
    userId: comment.userId,
    userName: comment.userName,
    text: comment.text,
    createdAt: new Date(),
  };

  // Update tasks
  setTasks(
    tasks.map((task) =>
      task.id === taskId
        ? { 
            ...task, 
            comments: [...(task.comments || []), newComment] 
          }
        : task
    )
  );

  // Update projects
  setProjects((prevProjects) =>
    prevProjects.map((project) => ({
      ...project,
      tasks: project.tasks ? project.tasks.map((task) =>
        task.id === taskId
          ? { 
              ...task, 
              comments: [...(task.comments || []), newComment] 
            }
          : task
      ) : [],
    }))
  );
};
