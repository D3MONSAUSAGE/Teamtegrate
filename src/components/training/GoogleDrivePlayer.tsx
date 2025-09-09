import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

interface GoogleDrivePlayerProps {
  fileId: string;
  title?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onReady?: () => void;
  autoplay?: boolean;
  className?: string;
}

const GoogleDrivePlayer: React.FC<GoogleDrivePlayerProps> = ({
  fileId,
  title,
  onProgress,
  onComplete,
  onReady,
  autoplay = false,
  className
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [useVideo, setUseVideo] = useState(true);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Multiple URL formats to try for Google Drive videos
  const videoUrls = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.google.com/uc?id=${fileId}&export=download`,
    `https://drive.google.com/file/d/${fileId}/preview${autoplay ? '?autoplay=1' : ''}`
  ];

  const startProgressTracking = useCallback((duration?: number) => {
    if (progressIntervalRef.current) return;
    
    startTimeRef.current = Date.now();
    const videoDuration = duration || 300; // Use actual duration or default 5 minutes
    
    progressIntervalRef.current = setInterval(() => {
      if (startTimeRef.current && useVideo && videoRef.current) {
        // Use actual video currentTime and duration for HTML5 video
        const currentTime = videoRef.current.currentTime;
        const totalDuration = videoRef.current.duration;
        
        if (totalDuration > 0) {
          const actualProgress = (currentTime / totalDuration) * 100;
          setProgress(actualProgress);
          onProgress?.(actualProgress);
          
          if (actualProgress >= 99 || videoRef.current.ended) {
            onComplete?.();
            stopProgressTracking();
          }
        }
      } else if (startTimeRef.current) {
        // Fallback timing for iframe
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const estimatedProgress = Math.min((elapsed / videoDuration) * 100, 95);
        
        setProgress(estimatedProgress);
        onProgress?.(estimatedProgress);
        
        if (estimatedProgress >= 95) {
          onComplete?.();
          stopProgressTracking();
        }
      }
    }, 1000);
  }, [onProgress, onComplete, useVideo]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleVideoLoad = useCallback(() => {
    setLoading(false);
    setError(null);
    onReady?.();
    
    if (videoRef.current && autoplay) {
      videoRef.current.play();
      startProgressTracking(videoRef.current.duration);
    }
  }, [onReady, autoplay, startProgressTracking]);

  const handleVideoError = useCallback(() => {
    console.log(`Failed to load video with URL index ${currentUrlIndex}`);
    
    if (currentUrlIndex < videoUrls.length - 1) {
      // Try next URL
      setCurrentUrlIndex(prev => prev + 1);
      setLoading(true);
    } else if (useVideo) {
      // Switch to iframe fallback
      console.log('Switching to iframe fallback');
      setUseVideo(false);
      setCurrentUrlIndex(0);
      setLoading(true);
    } else {
      // All methods failed
      setLoading(false);
      setError('Failed to load Google Drive video. Please check if the file is publicly accessible and in MP4 format.');
    }
  }, [currentUrlIndex, videoUrls.length, useVideo]);

  const handleVideoPlay = useCallback(() => {
    if (videoRef.current && !progressIntervalRef.current) {
      startProgressTracking(videoRef.current.duration);
    }
  }, [startProgressTracking]);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    setError(null);
    onReady?.();
    
    if (autoplay) {
      startProgressTracking();
    }
  }, [onReady, autoplay, startProgressTracking]);

  const handleIframeError = useCallback(() => {
    setLoading(false);
    setError('Failed to load Google Drive video. Please check if the file is publicly accessible.');
  }, []);

  const handleUserInteraction = useCallback(() => {
    if (!progressIntervalRef.current && !startTimeRef.current) {
      if (useVideo && videoRef.current) {
        videoRef.current.play();
        startProgressTracking(videoRef.current.duration);
      } else {
        startProgressTracking();
      }
    }
  }, [startProgressTracking, useVideo]);

  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  if (error) {
    return (
      <Card className="w-full aspect-video flex items-center justify-center bg-muted">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
          <p className="text-destructive mb-2">Video Error</p>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full aspect-video overflow-hidden ${className || ''}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading video...</p>
          </div>
        </div>
      )}
      
      {useVideo ? (
        <video
          ref={videoRef}
          src={videoUrls[currentUrlIndex]}
          title={title || 'Google Drive Video'}
          className="w-full h-full"
          controls
          autoPlay={autoplay}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onPlay={handleVideoPlay}
          onClick={handleUserInteraction}
        />
      ) : (
        <iframe
          ref={iframeRef}
          src={videoUrls[currentUrlIndex]}
          title={title || 'Google Drive Video'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          onClick={handleUserInteraction}
        />
      )}
      
      {progress > 0 && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded px-2 py-1">
          <div className="flex justify-between items-center text-xs text-white">
            <span>Progress: {Math.round(progress)}%</span>
            <div className="w-24 bg-gray-600 rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GoogleDrivePlayer;