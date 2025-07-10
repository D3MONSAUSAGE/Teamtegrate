
import { TaskComment } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const addEnhancedComment = async (
  targetId: string,
  targetType: 'task' | 'project',
  comment: {
    userId: string;
    userName: string;
    text: string;
    organizationId: string;
    category?: string;
    isPinned?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<TaskComment> => {
  try {
    const insertData: any = {
      user_id: comment.userId,
      content: comment.text,
      organization_id: comment.organizationId,
      category: comment.category || 'general',
      is_pinned: comment.isPinned || false,
      metadata: comment.metadata || {}
    };

    if (targetType === 'task') {
      insertData.task_id = targetId;
    } else {
      insertData.project_id = targetId;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding enhanced comment:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      userName: comment.userName,
      text: data.content,
      taskId: data.task_id || '',
      projectId: data.project_id || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      category: data.category,
      isPinned: data.is_pinned,
      metadata: (data.metadata as Record<string, any>) || {},
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error in addEnhancedComment:', error);
    throw error;
  }
};

export const fetchEnhancedComments = async (
  targetId: string,
  targetType: 'task' | 'project',
  filters?: {
    category?: string;
    showPinnedOnly?: boolean;
    searchQuery?: string;
  }
): Promise<TaskComment[]> => {
  try {
    let query = supabase
      .from('comments')
      .select(`
        *,
        users!inner(name, email)
      `)
      .order('created_at', { ascending: false });

    if (targetType === 'task') {
      query = query.eq('task_id', targetId);
    } else {
      query = query.eq('project_id', targetId);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.showPinnedOnly) {
      query = query.eq('is_pinned', true);
    }

    if (filters?.searchQuery) {
      query = query.ilike('content', `%${filters.searchQuery}%`);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('Error fetching enhanced comments:', error);
      throw error;
    }

    if (!comments || comments.length === 0) {
      return [];
    }

    return comments.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      userName: (comment.users as any)?.name || (comment.users as any)?.email || 'Unknown User',
      text: comment.content,
      taskId: comment.task_id || '',
      projectId: comment.project_id || '',
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      category: comment.category,
      isPinned: comment.is_pinned,
      metadata: (comment.metadata as Record<string, any>) || {},
      organizationId: comment.organization_id
    }));
  } catch (error) {
    console.error('Error in fetchEnhancedComments:', error);
    return [];
  }
};

export const updateProjectComment = async (
  commentId: string,
  updates: {
    content?: string;
    category?: string;
    is_pinned?: boolean;
  }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        content: updates.content,
        category: updates.category,
        is_pinned: updates.is_pinned,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error updating project comment:', error);
      throw error;
    }
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

export const searchProjectComments = async (
  projectId: string,
  searchQuery: string
): Promise<TaskComment[]> => {
  return await fetchEnhancedComments(projectId, 'project', {
    searchQuery
  });
};

export const getProjectCommentStats = async (projectId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_project_comment_stats', {
      project_id_param: projectId
    });

    if (error) {
      console.error('Error getting project comment stats:', error);
      // Return default stats if function fails
      return {
        total_comments: 0,
        recent_comments: 0,
        pinned_comments: 0,
        categories: []
      };
    }

    return data || {
      total_comments: 0,
      recent_comments: 0,
      pinned_comments: 0,
      categories: []
    };
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
