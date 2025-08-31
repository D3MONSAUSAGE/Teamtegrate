import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pin } from 'lucide-react';
import { format } from 'date-fns';

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

interface BulletinPostCardProps {
  post: BulletinPost;
  canDelete: boolean;
  onDelete: (postId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  company_policy: 'Company Policy',
  newsletter: 'Newsletter',
  announcements: 'Announcements',
  training: 'Training',
  safety: 'Safety'
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-secondary',
  company_policy: 'bg-red-100 text-red-800',
  newsletter: 'bg-blue-100 text-blue-800',
  announcements: 'bg-yellow-100 text-yellow-800',
  training: 'bg-green-100 text-green-800',
  safety: 'bg-orange-100 text-orange-800'
};

const BulletinPostCard = ({ post, canDelete, onDelete }: BulletinPostCardProps) => {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  return (
    <Card className={post.is_pinned ? 'border-primary shadow-md' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {post.is_pinned && (
                <Pin className="h-4 w-4 text-primary" />
              )}
              <h3 className="font-semibold text-lg">{post.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>By {post.users?.name || 'Unknown'}</span>
              <span>•</span>
              <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
              <Badge 
                variant="secondary" 
                className={CATEGORY_COLORS[post.category] || 'bg-secondary'}
              >
                {CATEGORY_LABELS[post.category] || post.category}
              </Badge>
            </div>
          </div>
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-foreground leading-relaxed">
            {post.content}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulletinPostCard;