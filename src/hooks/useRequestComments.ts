import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RequestComment } from '@/types/requests';
import { enhancedNotifications } from '@/utils/enhancedNotifications';

export function useRequestComments(requestId: string) {
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_comments')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setComments((data || []).map(item => ({
        ...item,
        user: (item.user as any)?.id ? item.user as any : undefined
      })) as RequestComment[]);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const addComment = useCallback(async (content: string, isInternal = false) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: orgRow, error: orgErr } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.user.id)
        .single();
      if (orgErr) throw orgErr;
      const orgId = orgRow?.organization_id as string | undefined;

      const { error: commentErr } = await supabase
        .from('request_comments')
        .insert({
          request_id: requestId,
          user_id: user.user.id,
          content,
          is_internal: isInternal,
          organization_id: orgId
        });

      if (commentErr) throw commentErr;

      // Log activity
      if (orgId) {
        await supabase.from('request_activity_feed').insert({
          organization_id: orgId,
          request_id: requestId,
          user_id: user.user.id,
          activity_type: 'comment_added',
          activity_data: { preview: content.slice(0, 200) }
        });
      }

      // Refresh comments immediately
      await fetchComments();
      enhancedNotifications.success('Comment added successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
      enhancedNotifications.error('Failed to add comment');
      throw err;
    }
  }, [requestId, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time updates for comments
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-comments-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_comments',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    refreshComments: fetchComments
  };
}