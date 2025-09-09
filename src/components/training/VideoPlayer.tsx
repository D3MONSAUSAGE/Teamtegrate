import React from 'react';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { isValidVideoInput } from '@/lib/youtube';
import UniversalVideoPlayer from './UniversalVideoPlayer';

interface VideoPlayerProps {
  youtubeVideoId?: string;
  videoUrl?: string;
  videoSource?: 'youtube' | 'google_drive' | 'direct_link';
  title?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  youtubeVideoId, // For backward compatibility
  videoUrl,
  videoSource,
  title,
  onProgress,
  onComplete 
}) => {
  // Use videoUrl if provided, otherwise fall back to youtubeVideoId for backward compatibility
  const actualVideoUrl = videoUrl || youtubeVideoId;
  
  if (!actualVideoUrl || !isValidVideoInput(actualVideoUrl)) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center bg-muted">
        <div className="text-center">
          <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Invalid video URL</p>
        </div>
      </Card>
    );
  }

  return (
    <UniversalVideoPlayer
      videoUrl={actualVideoUrl}
      videoSource={videoSource}
      title={title}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
};

export default VideoPlayer;