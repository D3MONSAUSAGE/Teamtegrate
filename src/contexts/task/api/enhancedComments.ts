
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
