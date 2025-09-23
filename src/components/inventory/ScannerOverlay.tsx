import React, { useEffect, useRef } from 'react';
import { X, Flashlight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScannerOverlayProps {
  isScanning: boolean;
  onClose: () => void;
  onToggleFlash?: () => void;
  flashEnabled?: boolean;
  instructions?: string;
  videoElement?: HTMLVideoElement | null;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  isScanning,
  onClose,
  onToggleFlash,
  flashEnabled = false,
  instructions = "Position the barcode within the frame to scan",
  videoElement
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isScanning && videoElement && videoContainerRef.current) {
      // Clear any existing video elements
      videoContainerRef.current.innerHTML = '';
      // Add the video element to the container
      videoContainerRef.current.appendChild(videoElement);
    }
  }, [isScanning, videoElement]);

  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video background */}
      <div 
        ref={videoContainerRef}
        className="absolute inset-0 w-full h-full"
      >
        {/* Fallback if no video element */}
        {!videoElement && (
          <div className="flex items-center justify-center w-full h-full bg-gray-900">
            <div className="text-center text-white">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10">
        {/* Header with close button */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </Button>
          
          {onToggleFlash && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFlash}
              className={cn(
                "bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm",
                flashEnabled && "bg-primary/80 text-primary-foreground"
              )}
            >
              <Flashlight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Scanning frame - centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            {/* Dark overlay around the scanning area */}
            <div className="absolute inset-0 bg-black/30 border-2 border-primary/50 rounded-lg">
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                   style={{ 
                     animation: 'scanLine 2s ease-in-out infinite alternate',
                   }} />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <p className="text-white text-center font-medium text-lg">{instructions}</p>
            <p className="text-white/80 text-center text-sm mt-2">
              Make sure the barcode is clearly visible and well-lit
            </p>
          </div>
        </div>
      </div>

      {/* Global styles for animation - Added to document head */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scanLine {
            0% { transform: translateY(0); opacity: 0.8; }
            50% { opacity: 1; }
            100% { transform: translateY(calc(16rem - 4px)); opacity: 0.8; }
          }
          @media (min-width: 768px) {
            @keyframes scanLine {
              0% { transform: translateY(0); opacity: 0.8; }
              50% { opacity: 1; }
              100% { transform: translateY(calc(20rem - 4px)); opacity: 0.8; }
            }
          }
        `
      }} />
    </div>
  );
};