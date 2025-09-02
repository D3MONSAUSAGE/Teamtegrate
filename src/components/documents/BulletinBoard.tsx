import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import BulletinPostCard from './BulletinPostCard';
import BulletinPostForm from './BulletinPostForm';
import BulletinSearch from './BulletinSearch';
import { BulletinPostSkeleton } from '@/components/ui/loading-skeleton';
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
  document_id?: string;
  users: {
    name: string;
    email: string;
  };
  documents?: {
    id: string;
    title: string;
    file_path: string;
    file_type: string;
    size_bytes: number;
  };
}

const BulletinBoard = () => {
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;

    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.users?.name.toLowerCase().includes(query) ||
      post.documents?.title.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <span className="text-muted-foreground">Loading posts...</span>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <BulletinPostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Company Bulletin Board</h2>
            <p className="text-sm text-muted-foreground">Stay updated with company announcements and news</p>
          </div>
        </div>
        {canCreatePosts && (
          <Button onClick={() => setShowPostForm(true)} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Post Form */}
      {showPostForm && canCreatePosts && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <BulletinPostForm
            onPostCreated={handlePostCreated}
            onCancel={() => setShowPostForm(false)}
          />
        </div>
      )}

      {/* Search */}
      <BulletinSearch 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Posts Content */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery.trim() ? 'No posts found' : 'No bulletin posts yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery.trim() 
              ? 'Try adjusting your search terms to find what you\'re looking for.' 
              : posts.length === 0 
                ? (canCreatePosts 
                  ? 'Create the first post to get the conversation started!' 
                  : 'Check back later for company updates and announcements.')
                : 'No posts match your current search criteria.'
            }
          </p>
          {canCreatePosts && !searchQuery.trim() && posts.length === 0 && (
            <Button onClick={() => setShowPostForm(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <BulletinPostCard
              key={post.id}
              post={post}
              canDelete={canCreatePosts || post.author_id === user?.id}
              onDelete={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletinBoard;