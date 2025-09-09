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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationEstimateRef = useRef<number>(300); // Default 5 minutes

  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview${autoplay ? '?autoplay=1' : ''}`;

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) return;
    
    startTimeRef.current = Date.now();
    progressIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const estimatedProgress = Math.min((elapsed / durationEstimateRef.current) * 100, 95);
        
        setProgress(estimatedProgress);
        onProgress?.(estimatedProgress);
        
        // Auto-complete after estimated duration
        if (estimatedProgress >= 95) {
          onComplete?.();
          stopProgressTracking();
        }
      }
    }, 1000);
  }, [onProgress, onComplete]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    setError(null);
    onReady?.();
    
    // Start progress tracking when video loads
    if (autoplay) {
      startProgressTracking();
    }
  }, [onReady, autoplay, startProgressTracking]);

  const handleIframeError = useCallback(() => {
    setLoading(false);
    setError('Failed to load Google Drive video. Please check if the file is publicly accessible.');
  }, []);

  const handleUserInteraction = useCallback(() => {
    // Start tracking on user interaction if not already started
    if (!progressIntervalRef.current && !startTimeRef.current) {
      startProgressTracking();
    }
  }, [startProgressTracking]);

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
      
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title || 'Google Drive Video'}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        onClick={handleUserInteraction}
        onPlay={handleUserInteraction}
      />
      
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