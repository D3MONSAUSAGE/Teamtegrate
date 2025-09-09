import React from 'react';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';
import { extractYouTubeVideoId } from '@/lib/youtube';

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
  // Extract video ID from URL or use as-is if it's already a video ID
  const extractedVideoId = extractYouTubeVideoId(youtubeVideoId);
  
  if (!youtubeVideoId || !extractedVideoId) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center bg-muted">
        <div className="text-center">
          <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Invalid or missing video</p>
        </div>
      </Card>
    );
  }

  return (
    <YouTubePlayer
      videoId={extractedVideoId}
      title={title}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
};

export default VideoPlayer;