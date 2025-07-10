
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
      taskId: comment.task_id,
      projectId: comment.project_id,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      category: comment.category,
      isPinned: comment.is_pinned,
      metadata: (comment.metadata as Record<string, any>) || {},
      organizationId: comment.organization_id
    })) || [];
  } catch (error) {
    console.error('Error in fetchTaskComments:', error);
    return [];
  }
};

export const fetchProjectComments = async (projectId: string): Promise<TaskComment[]> => {
  try {
    // First get the comments
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching project comments:', commentsError);
      throw commentsError;
    }

    if (!comments || comments.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(comments.map(comment => comment.user_id))];

    // Fetch user names for those IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continue without user names rather than failing completely
    }

    // Create a map of user ID to user info
    const userMap = new Map();
    if (users) {
      users.forEach(user => {
        userMap.set(user.id, user);
      });
    }

    return comments.map(comment => {
      const user = userMap.get(comment.user_id);
      return {
        id: comment.id,
        userId: comment.user_id,
        userName: user?.name || user?.email || 'Unknown User',
        text: comment.content,
        taskId: comment.task_id || '',
        projectId: comment.project_id,
        createdAt: new Date(comment.created_at),
        updatedAt: new Date(comment.updated_at),
        category: comment.category,
        isPinned: comment.is_pinned,
        metadata: (comment.metadata as Record<string, any>) || {},
        organizationId: comment.organization_id
      };
    });
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
      taskId: data.task_id,
      projectId: data.project_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      category: data.category,
      isPinned: data.is_pinned,
      metadata: (data.metadata as Record<string, any>) || {},
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error in addTaskComment:', error);
    throw error;
  }
};

export const addProjectComment = async (projectId: string, comment: { userId: string; userName: string; text: string; organizationId: string; category?: string; isPinned?: boolean }): Promise<TaskComment> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: comment.userId,
        project_id: projectId,
        content: comment.text,
        organization_id: comment.organizationId,
        category: comment.category || 'general',
        is_pinned: comment.isPinned || false
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
      taskId: data.task_id || '',
      projectId: data.project_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      category: data.category,
      isPinned: data.is_pinned,
      metadata: (data.metadata as Record<string, any>) || {},
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error in addProjectComment:', error);
    throw error;
  }
};
