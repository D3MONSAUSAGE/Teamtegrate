
import { TaskComment } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { addOrgIdToInsert, validateUserOrganization } from '@/utils/organizationHelpers';

export const fetchTaskComments = async (
  taskId: string,
  user: { id: string; organization_id?: string }
): Promise<TaskComment[] | null> => {
  try {
    validateUserOrganization(user);

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .eq('organization_id', user.organization_id);
    
    if (error) {
      console.error('Error fetching comments:', error);
      return null;
    }

    return (data || []).map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      userName: 'User', // Will be populated from user data
      text: comment.content,
      createdAt: new Date(comment.created_at)
    }));
  } catch (error) {
    console.error('Error fetching comments for task:', error);
    return null;
  }
};

export const addCommentToTask = async (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  user: { id: string; organization_id?: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    validateUserOrganization(user);

    const newComment: TaskComment = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: new Date()
    };
    
    // Insert comment into database with organization_id
    const commentData = {
      id: newComment.id,
      user_id: comment.userId,
      task_id: taskId,
      content: comment.text,
      created_at: newComment.createdAt.toISOString(),
      updated_at: newComment.createdAt.toISOString()
    };

    const insertData = addOrgIdToInsert(commentData, user);

    const { error } = await supabase
      .from('comments')
      .insert(insertData);

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return null;
    }
    
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
            return {
              ...task,
              comments: [...(task.comments || []), newComment]
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
