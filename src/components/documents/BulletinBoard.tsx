import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BulletinPostCard from './BulletinPostCard';
import BulletinPostForm from './BulletinPostForm';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';

interface BulletinPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  users: {
    name: string;
    email: string;
  };
}

const BulletinBoard = () => {
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const { user } = useAuth();
  const { hasRoleAccess } = useRoleAccess(user);
  
  const canCreatePosts = hasRoleAccess('manager');

  const fetchPosts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data: postsData, error } = await supabase
        .from('bulletin_posts')
        .select(`
          *,
          documents (
            id,
            title,
            file_path,
            file_type,
            size_bytes
          )
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bulletin posts:', error);
        toast.error('Error loading bulletin posts');
        return;
      }

      // Fetch user data for each post
      const postsWithUsers = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', post.author_id)
            .single();

          return {
            ...post,
            users: userData || { name: 'Unknown', email: '' }
          };
        })
      );

      setPosts(postsWithUsers);
    } catch (err) {
      console.error('Exception fetching bulletin posts:', err);
      toast.error('Failed to load bulletin posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => {
    setShowPostForm(false);
    fetchPosts();
  };

  const handlePostDeleted = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('bulletin_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        toast.error('Error deleting post');
        return;
      }

      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription
    const channel = supabase
      .channel('bulletin_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bulletin_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading bulletin posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canCreatePosts && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Company Bulletin Board</h2>
          <Button onClick={() => setShowPostForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      )}

      {!canCreatePosts && (
        <h2 className="text-lg font-semibold">Company Bulletin Board</h2>
      )}

      {showPostForm && canCreatePosts && (
        <BulletinPostForm
          onPostCreated={handlePostCreated}
          onCancel={() => setShowPostForm(false)}
        />
      )}

      {posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No bulletin posts yet. {canCreatePosts ? 'Create the first post!' : 'Check back later for updates.'}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <BulletinPostCard
              key={post.id}
              post={post}
              canDelete={canCreatePosts && post.author_id === user?.id}
              onDelete={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletinBoard;