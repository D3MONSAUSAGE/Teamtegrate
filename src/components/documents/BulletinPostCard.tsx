import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pin, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleDocumentDownload = async () => {
    if (!post.documents) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(post.documents.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = post.documents.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

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
        
        {post.documents && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">{post.documents.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.documents.file_type.split('/')[1]?.toUpperCase()} • {formatFileSize(post.documents.size_bytes)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDocumentDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulletinPostCard;