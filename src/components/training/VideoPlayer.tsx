import React from 'react';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';

interface VideoPlayerProps {
  youtubeVideoId: string;
  title?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  youtubeVideoId,
  title,
  onProgress,
  onComplete 
}) => {
  if (!youtubeVideoId) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center bg-muted">
        <div className="text-center">
          <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No video available</p>
        </div>
      </Card>
    );
  }

  return (
    <YouTubePlayer
      videoId={youtubeVideoId}
      title={title}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
};

export default VideoPlayer;