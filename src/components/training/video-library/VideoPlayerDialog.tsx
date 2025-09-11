import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VideoLibraryItem, useIncrementViewCount } from '@/hooks/useVideoLibrary';
import UniversalVideoPlayer from '../UniversalVideoPlayer';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Tag } from 'lucide-react';

interface VideoPlayerDialogProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VideoPlayerDialog: React.FC<VideoPlayerDialogProps> = ({
  videoId,
  open,
  onOpenChange,
}) => {
  const incrementViewCount = useIncrementViewCount();

  const { data: video, isLoading } = useQuery({
    queryKey: ['video-library-item', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_library_items')
        .select(`
          *,
          category:video_library_categories(*)
        `)
        .eq('id', videoId)
        .single();

      if (error) throw error;
      return data as VideoLibraryItem;
    },
    enabled: !!videoId && open,
  });

  // Increment view count when video is opened
  useEffect(() => {
    if (open && videoId) {
      incrementViewCount.mutate(videoId);
    }
  }, [open, videoId, incrementViewCount]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading video...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!video) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Video not found</h3>
            <p className="text-sm text-muted-foreground">
              The requested video could not be loaded
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {video.title}
          </DialogTitle>
          <DialogDescription>
            {video.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-video">
            <UniversalVideoPlayer
              videoUrl={video.youtube_url}
              title={video.title}
              autoplay={true}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {video.category && (
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${video.category.color}20`, color: video.category.color }}
              >
                {video.category.name}
              </Badge>
            )}
            
            {video.duration_minutes && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{video.duration_minutes}m</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{video.view_count + 1} views</span>
            </div>
          </div>

          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};