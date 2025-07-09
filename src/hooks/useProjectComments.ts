
import { useState, useEffect, useCallback } from 'react';
import { TaskComment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProjectComments, addProjectComment } from '@/contexts/task/api/comments';
import { toast } from 'sonner';

export function useProjectComments(projectId: string | null) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!projectId) {
      setComments([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const projectComments = await fetchProjectComments(projectId);
      setComments(projectComments);
    } catch (err: any) {
      console.error('Error fetching project comments:', err);
      setError(err.message || 'Failed to fetch project comments');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addComment = useCallback(async (commentText: string, category?: string, isPinned?: boolean) => {
    if (!projectId || !user) {
      toast.error('Unable to add comment');
      return;
    }

    try {
      const newComment = await addProjectComment(projectId, {
        userId: user.id,
        userName: user.name,
        text: commentText,
        organizationId: user.organizationId || '',
        category,
        isPinned
      });

      // Add the new comment to the beginning of the list (most recent first)
      setComments(prev => [newComment, ...prev]);
      toast.success('Project update added successfully');
      
      return newComment;
    } catch (err: any) {
      console.error('Error adding project comment:', err);
      toast.error('Failed to add project update');
      throw err;
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    refreshComments: fetchComments
  };
}
