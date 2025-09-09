import React, { useRef, useState, useEffect, useCallback } from 'react';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube';
import { Card } from '@/components/ui/card';
import { Play, Loader2 } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onReady?: () => void;
  autoplay?: boolean;
  className?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  onProgress,
  onComplete,
  onReady,
  autoplay = false,
  className = ""
}) => {
  console.log('YouTubePlayer rendering with videoId:', videoId);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      fs: 1,
      cc_load_policy: 0,
      iv_load_policy: 3,
      autohide: 0,
      controls: 1,
      disablekb: 0,
      enablejsapi: 1,
      playsinline: 1
    }
  };

  const handleReady = useCallback((event: YouTubeEvent) => {
    console.log('YouTube video ready:', videoId);
    setIsReady(true);
    setIsLoading(false);
    setError(null);
    playerRef.current = event.target;
    onReady?.();
    
    // Start progress tracking
    startProgressTracking();
  }, [onReady, videoId]);

  const handleError = useCallback((event: YouTubeEvent) => {
    const errorCode = event.data;
    let errorMessage = 'Failed to load video';
    let userFriendlyMessage = '';
    
    // YouTube error codes: https://developers.google.com/youtube/iframe_api_reference#Events
    switch (errorCode) {
      case 2:
        errorMessage = 'Invalid video ID';
        userFriendlyMessage = 'The video ID format is invalid. Please check the YouTube URL.';
        break;
      case 5:
        errorMessage = 'HTML5 player error';
        userFriendlyMessage = 'Video player error. Try refreshing the page.';
        break;
      case 100:
        errorMessage = 'Video not found or private';
        userFriendlyMessage = 'Video not found. It may be private, deleted, or have restricted access.';
        break;
      case 101:
      case 150:
        errorMessage = 'Video embedding disabled';
        userFriendlyMessage = 'This video cannot be embedded. The owner has disabled embedding for this video.';
        break;
      default:
        errorMessage = `Video error (code: ${errorCode})`;
        userFriendlyMessage = 'Unable to load video. Please try a different video or contact support.';
    }
    
    console.error('YouTube player error:', { errorCode, videoId, errorMessage });
    
    // Special handling for videos with dash-starting IDs
    if (videoId.startsWith('-')) {
      console.error('Video ID starts with dash, this often causes embedding issues:', videoId);
      userFriendlyMessage += ' Note: This video ID starts with a dash, which may cause embedding restrictions.';
    }
    
    setError(userFriendlyMessage || errorMessage);
    setIsLoading(false);
  }, [videoId]);

  const handleStateChange = useCallback((event: YouTubeEvent) => {
    const playerState = event.data;
    
    // YouTube Player States:
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
    if (playerState === 0) { // ended
      onComplete?.();
      stopProgressTracking();
    } else if (playerState === 1) { // playing
      startProgressTracking();
    } else if (playerState === 2) { // paused
      stopProgressTracking();
    }
  }, [onComplete]);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          
          if (duration && duration > 0) {
            const progress = (currentTime / duration) * 100;
            onProgress?.(Math.min(progress, 100));
          }
        } catch (error) {
          console.error('Error getting player progress:', error);
        }
      }
    }, 1000);
  }, [onProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  // Public methods for external control
  const play = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  const getCurrentTime = useCallback((): number => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      return playerRef.current.getCurrentTime();
    }
    return 0;
  }, []);

  const getDuration = useCallback((): number => {
    if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
      return playerRef.current.getDuration();
    }
    return 0;
  }, []);

  // Expose methods via ref (if needed by parent)
  React.useImperativeHandle(playerRef, () => ({
    play,
    pause,
    seekTo,
    getCurrentTime,
    getDuration
  }));

  if (error) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center bg-muted">
        <div className="text-center space-y-4 p-6">
          <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Video Unavailable</p>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          </div>
          {videoId.startsWith('-') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                💡 Tip: Try re-uploading your video to YouTube to get a different video ID, or make the video public instead of unlisted.
              </p>
            </div>
          )}
          <div className="mt-4">
            <a 
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Watch on YouTube instead →
            </a>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold">{title}</h3>
      )}
      
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading video...</p>
            </div>
          </div>
        )}
        
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          onError={handleError}
          onStateChange={handleStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full rounded-lg"
        />
      </div>
    </div>
  );
};

export default YouTubePlayer;