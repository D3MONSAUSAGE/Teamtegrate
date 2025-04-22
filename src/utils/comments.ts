
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to transform database comment to application comment
const transformDatabaseComment = (dbComment: any): Comment => {
  return {
    id: dbComment.id,
    userId: dbComment.user_id,
    userName: dbComment.user_name || 'User', // We'll need to fetch this separately
    text: dbComment.content,
    createdAt: new Date(dbComment.created_at)
  };
};

export async function fetchComments(taskId?: string, projectId?: string): Promise<Comment[]> {
  try {
    const query = supabase
      .from('comments')
      .select('comments.*, users.name as user_name')
      .order('created_at', { ascending: true });

    if (taskId) {
      query.eq('task_id', taskId);
    } else if (projectId) {
      query.eq('project_id', projectId);
    }

    // Join with users table to get user names
    query.join('users', { 'users.id': 'comments.user_id' });

    const { data, error } = await query;

    if (error) throw error;
    
    // Transform the data to match our Comment type
    return data ? data.map(transformDatabaseComment) : [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function addComment(content: string, taskId?: string, projectId?: string): Promise<Comment | null> {
  try {
    // Get current user
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        content,
        task_id: taskId,
        project_id: projectId,
        user_id: userId
      }])
      .select('comments.*, users.name as user_name')
      .join('users', { 'users.id': 'comments.user_id' })
      .single();

    if (error) throw error;
    toast.success('Comment added successfully');
    
    return data ? transformDatabaseComment(data) : null;
  } catch (error) {
    console.error('Error adding comment:', error);
    toast.error('Failed to add comment');
    return null;
  }
}

export async function updateComment(id: string, content: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('comments.*, users.name as user_name')
      .join('users', { 'users.id': 'comments.user_id' })
      .single();

    if (error) throw error;
    toast.success('Comment updated successfully');
    
    return data ? transformDatabaseComment(data) : null;
  } catch (error) {
    console.error('Error updating comment:', error);
    toast.error('Failed to update comment');
    return null;
  }
}

export async function deleteComment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Comment deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    toast.error('Failed to delete comment');
    return false;
  }
}
