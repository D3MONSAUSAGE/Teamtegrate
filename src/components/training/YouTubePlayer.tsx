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
    setIsReady(true);
    setIsLoading(false);
    setError(null);
    playerRef.current = event.target;
    onReady?.();
    
    // Start progress tracking
    startProgressTracking();
  }, [onReady]);

  const handleError = useCallback((event: YouTubeEvent) => {
    setError('Failed to load video');
    setIsLoading(false);
    console.error('YouTube player error:', event.data);
  }, []);

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
        <div className="text-center">
          <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">{error}</p>
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