import React, { useEffect, useRef, useState } from 'react';
import { X, Flashlight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startScan, stopScan, switchToBackCamera } from '@/lib/barcode/Scanner';

interface ScannerOverlayProps {
  open: boolean;
  onClose: () => void;
  onBarcode: (text: string) => void;
  continuous?: boolean;
  instructions?: string;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  open,
  onClose,
  onBarcode,
  continuous = true,
  instructions = "Position the barcode within the frame to scan"
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Comprehensive cleanup on visibility change, navigation, and unmount
  useEffect(() => {
    const vis = () => { if (document.hidden) handleClose(); };
    const beforeUnload = () => handleClose();
    const popstate = () => handleClose();
    const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    
    if (open) {
      document.addEventListener('visibilitychange', vis);
      document.addEventListener('keydown', keydown);
      window.addEventListener('beforeunload', beforeUnload);
      window.addEventListener('popstate', popstate);
    }
    
    // Cleanup on component unmount
    return () => {
      handleStop();
      document.removeEventListener('visibilitychange', vis);
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', popstate);
    };
  }, [open]);

  async function handleStart() {
    if (isLoading || active) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await switchToBackCamera();
      if (!videoRef.current) return;
      await startScan(videoRef.current, (text) => {
        onBarcode(text);
        if (!continuous) handleStop();
      });
      setActive(true);
    } catch (e: any) {
      const errorMsg = e?.message ?? 'Unable to start camera';
      setError(errorMsg);
      setActive(false);
      
      // Map common error types to user-friendly messages
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (errorMsg.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else if (errorMsg.includes('OverconstrainedError')) {
        setError('Camera configuration not supported. Try a different device.');
      } else if (errorMsg.includes('SecurityError')) {
        setError('Camera access requires a secure connection (HTTPS).');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    console.log('ScannerOverlay handleClose called');
    setIsClosing(true);
    onClose(); // Call onClose first to immediately hide overlay
    handleStop();
  }

  function handleStop() {
    console.log('ScannerOverlay handleStop called');
    setIsLoading(false);
    setActive(false);
    setError(null);
    
    // Use the Scanner's stopScan function
    try { 
      stopScan(); 
    } catch (error) {
      console.error('Error in stopScan:', error);
    }
    
    // Additional cleanup for video element
    try {
      const stream = (videoRef.current as any)?.srcObject as MediaStream | undefined;
      if (stream) {
        stream.getTracks()?.forEach(track => {
          console.log(`Stopping overlay track: ${track.kind}`);
          track.stop();
        });
      }
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Error in additional cleanup:', error);
    }
  }

  async function handleToggleFlash() {
    try {
      const stream = (videoRef.current as any)?.srcObject as MediaStream | undefined;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track && 'applyConstraints' in track) {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          });
          setFlashEnabled(!flashEnabled);
        }
      }
    } catch (e) {
      console.log('Flash not supported on this device');
    }
  }

  // Reset states when open prop changes
  useEffect(() => { 
    if (!open) {
      console.log('Scanner overlay closed, stopping camera');
      handleStop();
      setIsClosing(false); // Reset closing state
    } else {
      setIsClosing(false); // Reset closing state when opening
    }
  }, [open]);

  if (!open || isClosing) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onClick={(e) => {
        // Close when clicking outside the scanning frame
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Video background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        
        {/* Fallback if no video */}
        {!active && !error && (
          <div className="flex items-center justify-center w-full h-full bg-gray-900">
            <div className="text-center text-white">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ready to scan</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFlash}
            className={`bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm ${
              flashEnabled ? 'bg-primary/80 text-primary-foreground' : ''
            }`}
          >
            <Flashlight className="h-6 w-6" />
          </Button>
        </div>

        {/* Scanning frame - centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative w-64 h-64 md:w-80 md:h-80"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the frame
          >
            <div className="absolute inset-0 bg-black/30 border-2 border-primary/50 rounded-lg">
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning line animation */}
              {active && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="grid grid-cols-1 gap-3 mb-4">
            <Button
              className="px-4 py-3 rounded bg-white text-black font-medium hover:bg-gray-100"
              onClick={handleStart}
              disabled={active || isLoading}
            >
              {isLoading ? 'Starting...' : active ? 'Camera Active' : 'Start Camera'}
            </Button>
            {active && (
              <Button
                variant="outline"
                className="px-4 py-3 rounded bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleStop}
              >
                Stop Camera
              </Button>
            )}
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <p className="text-white text-center font-medium text-lg">{instructions}</p>
            <p className="text-white/80 text-center text-sm mt-2">
              Point camera at barcode and enter the code manually below
            </p>
            {active && (
              <input
                type="text"
                placeholder="Enter barcode manually"
                className="w-full mt-3 p-2 rounded bg-white/90 text-black placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    onBarcode(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white text-center text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};