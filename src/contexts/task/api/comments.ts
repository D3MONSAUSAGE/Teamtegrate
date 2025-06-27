
import { TaskComment } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const fetchTaskComments = async (taskId: string): Promise<TaskComment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching task comments:', error);
      throw error;
    }

    return data?.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      userName: comment.user_id, // We'll need to join with users table or store user name
      text: comment.content,
      createdAt: new Date(comment.created_at),
      organizationId: comment.organization_id
    })) || [];
  } catch (error) {
    console.error('Error in fetchTaskComments:', error);
    return [];
  }
};

export const fetchProjectComments = async (projectId: string): Promise<TaskComment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey(name, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project comments:', error);
      throw error;
    }

    return data?.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      userName: comment.users?.name || comment.users?.email || 'Unknown User',
      text: comment.content,
      createdAt: new Date(comment.created_at),
      organizationId: comment.organization_id
    })) || [];
  } catch (error) {
    console.error('Error in fetchProjectComments:', error);
    return [];
  }
};

export const addTaskComment = async (taskId: string, comment: { userId: string; userName: string; text: string; organizationId: string }): Promise<TaskComment> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: comment.userId,
        task_id: taskId,
        content: comment.text,
        organization_id: comment.organizationId
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task comment:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      userName: comment.userName,
      text: data.content,
      createdAt: new Date(data.created_at),
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error in addTaskComment:', error);
    throw error;
  }
};

export const addProjectComment = async (projectId: string, comment: { userId: string; userName: string; text: string; organizationId: string }): Promise<TaskComment> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: comment.userId,
        project_id: projectId,
        content: comment.text,
        organization_id: comment.organizationId
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error adding project comment:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      userName: comment.userName,
      text: data.content,
      createdAt: new Date(data.created_at),
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error in addProjectComment:', error);
    throw error;
  }
};
