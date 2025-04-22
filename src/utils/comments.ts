
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Comment } from '@/types';

// Helper function to transform database comment to application comment
const transformDatabaseComment = (dbComment: any): Comment => {
  return {
    id: dbComment.id,
    userId: dbComment.user_id,
    userName: dbComment.user_name || 'Anonymous',
    text: dbComment.content,
    createdAt: new Date(dbComment.created_at)
  };
};

export async function fetchComments(taskId?: string, projectId?: string): Promise<Comment[]> {
  try {
    // First fetch the comments
    const query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (taskId) {
      query.eq('task_id', taskId);
    } else if (projectId) {
      query.eq('project_id', projectId);
    }

    const { data: comments, error } = await query;

    if (error) throw error;
    if (!comments || comments.length === 0) return [];
    
    // Then get user names in a separate query
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);
    
    // Create a map of user IDs to names for easy lookup
    const userNameMap = new Map();
    if (users) {
      users.forEach(user => userNameMap.set(user.id, user.name));
    }
    
    // Transform comments with user names
    return comments.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      userName: userNameMap.get(comment.user_id) || 'User',
      text: comment.content,
      createdAt: new Date(comment.created_at)
    }));
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

    // Insert the comment first
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert([{
        content,
        task_id: taskId,
        project_id: projectId,
        user_id: userId
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Get the user name
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();
    
    toast.success('Comment added successfully');
    
    return {
      id: newComment.id,
      userId: newComment.user_id,
      userName: userData?.name || 'User',
      text: newComment.content,
      createdAt: new Date(newComment.created_at)
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    toast.error('Failed to add comment');
    return null;
  }
}

export async function updateComment(id: string, content: string): Promise<Comment | null> {
  try {
    // Update the comment
    const { data: updatedComment, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Get the user name
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', updatedComment.user_id)
      .single();
    
    toast.success('Comment updated successfully');
    
    return {
      id: updatedComment.id,
      userId: updatedComment.user_id,
      userName: userData?.name || 'User',
      text: updatedComment.content,
      createdAt: new Date(updatedComment.created_at)
    };
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
