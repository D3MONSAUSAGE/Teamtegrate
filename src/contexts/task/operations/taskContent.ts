
import { Task, Project, TaskComment, TaskStatus } from '@/types';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export const addCommentToTask = async (
  taskId: string,
  comment: { userId: string; userName: string; text: string; organizationId?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    const now = new Date();
    const newComment: TaskComment = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      taskId: taskId, // Add the missing taskId
      createdAt: now,
      updatedAt: now, // Add the missing updatedAt
      organizationId: comment.organizationId
    };

    // Find the task to get its project ID
    const task = tasks.find(t => t.id === taskId);
    const projectId = task?.projectId;
    
    // Save comment to Supabase for persistence
    const { error } = await supabase
      .from('comments')
      .insert({
        id: newComment.id,
        user_id: comment.userId,
        task_id: taskId,
        project_id: projectId,
        content: comment.text,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        organization_id: comment.organizationId || ''
      });

    if (error) {
      console.error('Error saving comment to database:', error);
      throw error;
    }
    
    // Update the task in the tasks array
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const updatedComments = [...(task.comments || []), newComment];
        return { ...task, comments: updatedComments };
      }
      return task;
    }));

    toast.success('Comment added successfully!');
  } catch (error) {
    console.error('Error in addCommentToTask:', error);
    playErrorSound();
    toast.error('Failed to add comment to task');
  }
};

export const addTagToTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  // Update the task in the tasks array
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId) {
      const updatedTags = [...(task.tags || []), tag];
      return { ...task, tags: updatedTags };
    }
    return task;
  }));

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
  // Update the task in the tasks array
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId && task.tags) {
      const updatedTags = task.tags.filter(t => t !== tag);
      return { ...task, tags: updatedTags };
    }
    return task;
  }));

  toast.success('Tag removed from task successfully!');
};
