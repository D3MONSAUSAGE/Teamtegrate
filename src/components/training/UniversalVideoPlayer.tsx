import React from 'react';
import { Card } from '@/components/ui/card';
import { Play, AlertCircle } from 'lucide-react';
import { parseVideoInput, VideoSource } from '@/lib/youtube';
import YouTubePlayer from './YouTubePlayer';
import GoogleDrivePlayer from './GoogleDrivePlayer';

interface UniversalVideoPlayerProps {
  videoUrl?: string;
  videoSource?: VideoSource;
  title?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onReady?: () => void;
  autoplay?: boolean;
  className?: string;
}

const DirectVideoPlayer: React.FC<{
  videoUrl: string;
  title?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onReady?: () => void;
  autoplay?: boolean;
  className?: string;
}> = ({ videoUrl, title, onProgress, onComplete, onReady, autoplay = false, className }) => {
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    onReady?.();
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      onProgress?.(progress);
    }
  };

  const handleEnded = () => {
    onComplete?.();
  };

  return (
    <Card className={`w-full aspect-video overflow-hidden ${className || ''}`}>
      <video
        className="w-full h-full"
        controls
        autoPlay={autoplay}
        title={title}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </Card>
  );
};

const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  videoUrl,
  videoSource,
  title,
  onProgress,
  onComplete,
  onReady,
  autoplay = false,
  className
}) => {
  if (!videoUrl) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center bg-muted">
        <div className="text-center">
          <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No video available</p>
        </div>
      </Card>
    );
  }

  // Parse video input if source is not provided
  let source = videoSource;
  let videoId = videoUrl;
  
  if (!source) {
    const videoInfo = parseVideoInput(videoUrl);
    if (!videoInfo) {
      return (
        <Card className="w-full aspect-video flex items-center justify-center bg-muted">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
            <p className="text-destructive mb-2">Invalid Video</p>
            <p className="text-sm text-muted-foreground">Unable to recognize video format</p>
          </div>
        </Card>
      );
    }
    source = videoInfo.source;
    videoId = videoInfo.id;
  }

  // Render appropriate player based on source
  switch (source) {
    case 'youtube':
      return (
        <YouTubePlayer
          videoId={videoId}
          title={title}
          onProgress={onProgress}
          onComplete={onComplete}
          onReady={onReady}
          autoplay={autoplay}
          className={className}
        />
      );

    case 'google_drive':
      return (
        <GoogleDrivePlayer
          fileId={videoId}
          title={title}
          onProgress={onProgress}
          onComplete={onComplete}
          onReady={onReady}
          autoplay={autoplay}
          className={className}
        />
      );

    case 'direct_link':
      return (
        <DirectVideoPlayer
          videoUrl={videoId}
          title={title}
          onProgress={onProgress}
          onComplete={onComplete}
          onReady={onReady}
          autoplay={autoplay}
          className={className}
        />
      );

    default:
      return (
        <Card className="w-full aspect-video flex items-center justify-center bg-muted">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
            <p className="text-destructive mb-2">Unsupported Video Source</p>
            <p className="text-sm text-muted-foreground">Video source "{source}" is not supported</p>
          </div>
        </Card>
      );
  }
};

export default UniversalVideoPlayer;