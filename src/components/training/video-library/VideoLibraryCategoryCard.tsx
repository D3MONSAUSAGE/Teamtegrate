import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Video } from 'lucide-react';
import { VideoLibraryCategory } from '@/hooks/useVideoLibrary';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoLibraryCategoryCardProps {
  category: VideoLibraryCategory;
}

export const VideoLibraryCategoryCard: React.FC<VideoLibraryCategoryCardProps> = ({
  category,
}) => {
  // Fetch video count for this category
  const { data: videoCount } = useQuery({
    queryKey: ['video-count', category.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('video_library_items')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">
          {category.name}
        </CardTitle>
        {category.description && (
          <CardDescription className="text-xs line-clamp-2">
            {category.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            <Video className="h-2 w-2 mr-1" />
            {videoCount ?? 0} videos
          </Badge>
          <div className="text-xs text-muted-foreground">
            {new Date(category.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};