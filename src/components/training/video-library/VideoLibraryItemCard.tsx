import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Eye, Clock, Tag, Trash2, Pencil } from 'lucide-react';
import { VideoLibraryItem } from '@/hooks/useVideoLibrary';

interface VideoLibraryItemCardProps {
  video: VideoLibraryItem;
  onPlayVideo?: (videoId: string) => void;
  onManagePermissions?: (videoId: string) => void;
  onEditVideo?: (video: VideoLibraryItem) => void;
  onDeleteVideo?: (videoId: string, videoTitle: string) => void;
  showManagement?: boolean;
}

export const VideoLibraryItemCard: React.FC<VideoLibraryItemCardProps> = ({
  video,
  onPlayVideo,
  onManagePermissions,
  onEditVideo,
  onDeleteVideo,
  showManagement = false,
}) => {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {video.title}
            </CardTitle>
            {video.category && (
              <Badge 
                variant="secondary" 
                className="mt-1 text-xs"
                style={{ backgroundColor: `${video.category.color}20`, color: video.category.color }}
              >
                {video.category.name}
              </Badge>
            )}
          </div>
        </div>
        {video.description && (
          <CardDescription className="text-xs line-clamp-2">
            {video.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            {video.duration_minutes && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{video.duration_minutes}m</span>
              </div>
            )}
            {video.view_count > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{video.view_count}</span>
              </div>
            )}
          </div>
        </div>

        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {video.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{video.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          {onPlayVideo && (
            <Button
              size="sm"
              onClick={() => onPlayVideo(video.id)}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              Watch
            </Button>
          )}
          {showManagement && onEditVideo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditVideo(video)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {showManagement && onManagePermissions && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManagePermissions(video.id)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
          {showManagement && onDeleteVideo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteVideo(video.id, video.title)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};