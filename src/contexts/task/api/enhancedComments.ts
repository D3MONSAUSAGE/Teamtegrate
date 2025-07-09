

import { TaskComment } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const updateProjectComment = async (commentId: string, updates: { content?: string; category?: string; is_pinned?: boolean; metadata?: any }): Promise<TaskComment> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({
        ...updates,
        content: updates.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating project comment:', error);
      throw error;
    }

    // Get user info for the updated comment
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', data.user_id)
      .single();

    if (usersError) {
      console.error('Error fetching user:', usersError);
    }

    return {
      id: data.id,
      userId: data.user_id,
      userName: users?.name || users?.email || 'Unknown User',
      text: data.content, // Map content to text
      taskId: data.task_id,
      projectId: data.project_id,
      createdAt: new Date(data.created_at), // Convert to Date
      updatedAt: new Date(data.updated_at), // Convert to Date
      category: data.category,
      isPinned: data.is_pinned,
      metadata: data.metadata,
      organizationId: data.organization_id // Add organizationId
    };
  } catch (error) {
    console.error('Error in updateProjectComment:', error);
    throw error;
  }
};

export const deleteProjectComment = async (commentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting project comment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteProjectComment:', error);
    throw error;
  }
};

export const searchProjectComments = async (projectId: string, searchQuery: string): Promise<TaskComment[]> => {
  try {
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .ilike('content', `%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error searching project comments:', commentsError);
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
        text: comment.content, // Map content to text
        taskId: comment.task_id,
        projectId: comment.project_id,
        createdAt: new Date(comment.created_at), // Convert to Date
        updatedAt: new Date(comment.updated_at), // Convert to Date
        category: comment.category,
        isPinned: comment.is_pinned,
        metadata: comment.metadata,
        organizationId: comment.organization_id // Add organizationId
      };
    });
  } catch (error) {
    console.error('Error in searchProjectComments:', error);
    return [];
  }
};

export const getProjectCommentStats = async (projectId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .rpc('get_project_comment_stats', { project_id_param: projectId });

    if (error) {
      console.error('Error getting project comment stats:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getProjectCommentStats:', error);
    return {
      total_comments: 0,
      recent_comments: 0,
      pinned_comments: 0,
      categories: []
    };
  }
};

