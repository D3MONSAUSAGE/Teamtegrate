import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Pin, Download, FileText, Eye } from 'lucide-react';
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
  safety: 'Safety',
  announcement: 'Announcement',
  policy: 'Policy',
  procedure: 'Procedure',
  news: 'News',
  event: 'Event'
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-secondary',
  company_policy: 'bg-red-100 text-red-800',
  newsletter: 'bg-blue-100 text-blue-800',
  announcements: 'bg-yellow-100 text-yellow-800',
  training: 'bg-green-100 text-green-800',
  safety: 'bg-orange-100 text-orange-800',
  announcement: 'bg-yellow-100 text-yellow-800',
  policy: 'bg-red-100 text-red-800',
  procedure: 'bg-purple-100 text-purple-800',
  news: 'bg-blue-100 text-blue-800',
  event: 'bg-teal-100 text-teal-800'
};

const BulletinPostCard = ({ post, canDelete, onDelete }: BulletinPostCardProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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

  const handleDocumentPreview = async () => {
    if (!post.documents) return;
    
    setIsLoadingPreview(true);
    setPreviewError(null);
    setIsPreviewOpen(true);
    
    try {
      // First try createSignedUrl
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(post.documents.file_path, 3600);

      if (!signedError && signedData?.signedUrl) {
        setPreviewUrl(signedData.signedUrl);
        setIsLoadingPreview(false);
        return;
      }

      // Fallback to download + object URL
      console.log('Signed URL failed, trying download fallback:', signedError);
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(post.documents.file_path);

      if (downloadError) throw downloadError;

      const objectUrl = window.URL.createObjectURL(downloadData);
      setPreviewUrl(objectUrl);
      setIsLoadingPreview(false);
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError('Unable to load preview. Please try downloading the document instead.');
      setIsLoadingPreview(false);
      toast.error('Preview failed - try downloading instead', {
        description: 'The document may be in a protected location or corrupted'
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  return (
    <Card className={`group transition-all duration-200 hover:shadow-lg ${
      post.is_pinned ? 'border-primary/50 shadow-md bg-gradient-to-r from-primary/5 to-transparent' : 'hover:border-primary/20'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {post.is_pinned && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20">
                  <Pin className="h-4 w-4 text-primary" fill="currentColor" />
                </div>
              )}
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                {post.title}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {(post.users?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{post.users?.name || 'Unknown'}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {format(new Date(post.created_at), 'MMM d, yyyy')}
              </span>
              <Badge 
                variant="secondary" 
                className={`${CATEGORY_COLORS[post.category] || 'bg-secondary'} border-0 font-medium`}
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
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="prose prose-sm max-w-none mb-4">
          <p className="whitespace-pre-wrap text-foreground leading-relaxed text-base">
            {post.content}
          </p>
        </div>
        
        {post.documents && (
          <div className="mt-6 p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.documents.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.documents.file_type.split('/')[1]?.toUpperCase()} • {formatFileSize(post.documents.size_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDocumentPreview}
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDocumentDownload}
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Document Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{post.documents?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading preview...</span>
              </div>
            ) : previewError ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">{previewError}</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleDocumentDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                  >
                    Open in new tab
                  </Button>
                </div>
              </div>
            ) : previewUrl && post.documents ? (
              <>
                {post.documents.file_type.startsWith('image/') ? (
                  <img 
                    src={previewUrl} 
                    alt={post.documents.title}
                    className="max-w-full max-h-[70vh] object-contain mx-auto"
                    onError={() => setPreviewError('Failed to load image preview')}
                  />
                ) : (post.documents.file_type === 'application/pdf' || 
                       post.documents.file_type === 'application/x-pdf' || 
                       post.documents.file_type.includes('pdf')) ? (
                  <div>
                    <iframe
                      src={previewUrl}
                      className="w-full h-[70vh] border-0"
                      title={post.documents.title}
                      onError={() => setPreviewError('PDF preview failed - browser may have blocked it')}
                    />
                    <div className="mt-2 text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        Open PDF in new tab
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">
                      Preview not available for {post.documents.file_type}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={handleDocumentDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download to view
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        Try opening in new tab
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BulletinPostCard;