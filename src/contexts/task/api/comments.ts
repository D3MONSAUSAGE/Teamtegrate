
import { TaskComment, ProjectTask } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { Task, Project } from '@/types';

export const fetchTaskComments = async (taskId: string): Promise<TaskComment[] | null> => {
  try {
    // In a real app, you would have a comments table. For now, we'll simulate it.
    // This would be replaced with actual API call to fetch comments from a database
    // For example:
    // const { data, error } = await supabase
    //   .from('comments')
    //   .select('*')
    //   .eq('task_id', taskId);
    
    // Since we don't have a comments table, we'll return an empty array
    // In a real implementation, this would contain actual comments from the database
    return [];
    
  } catch (error) {
    console.error('Error fetching comments for task:', error);
    return null;
  }
};

export const addCommentToTask = async (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    // In a real app, you would insert the comment into a database
    // For now, we'll just update the local state
    const newComment: TaskComment = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: new Date()
    };
    
    // Update tasks state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          comments: [...(task.comments || []), newComment]
        };
      }
      return task;
    }));
    
    // Update projects state
    setProjects(prevProjects => prevProjects.map(project => {
      return {
        ...project,
        tasks: project.tasks.map(task => {
          if (task.id === taskId) {
            // Ensure comments exist on the task before updating
            const taskComments = task.comments || [];
            return {
              ...task,
              comments: [...taskComments, newComment]
            };
          }
          return task;
        })
      };
    }));
    
    toast.success('Comment added successfully');
    return newComment;
    
  } catch (error) {
    console.error('Error adding comment:', error);
    toast.error('Failed to add comment');
    return null;
  }
};
