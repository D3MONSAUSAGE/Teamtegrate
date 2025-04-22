
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Comment } from '@/types';

export async function fetchComments(taskId?: string, projectId?: string): Promise<Comment[]> {
  try {
    const query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (taskId) {
      query.eq('task_id', taskId);
    } else if (projectId) {
      query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function addComment(content: string, taskId?: string, projectId?: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        content,
        task_id: taskId,
        project_id: projectId
      }])
      .select()
      .single();

    if (error) throw error;
    toast.success('Comment added successfully');
    return data;
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
      .select()
      .single();

    if (error) throw error;
    toast.success('Comment updated successfully');
    return data;
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
