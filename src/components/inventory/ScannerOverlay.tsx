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

  // Visibility: pause on hide to avoid iOS pausing weirdness
  useEffect(() => {
    const vis = () => { if (document.hidden) handleStop(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  async function handleStart() {
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
    }
  }

  function handleStop() {
    try { stopScan(); } catch {}
    try {
      const s = (videoRef.current as any)?.srcObject as MediaStream | undefined;
      s?.getTracks()?.forEach(t => t.stop());
    } catch {}
    setActive(false);
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

  useEffect(() => { 
    if (!open) handleStop(); 
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
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
            onClick={() => { handleStop(); onClose(); }}
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
          <div className="relative w-64 h-64 md:w-80 md:h-80">
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

        {/* Controls */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              className="px-4 py-3 rounded bg-white text-black font-medium hover:bg-gray-100"
              onClick={handleStart}
              disabled={active}
            >
              {active ? 'Scanning...' : 'Start Scanning'}
            </Button>
            <Button
              variant="outline"
              className="px-4 py-3 rounded bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleStop}
              disabled={!active}
            >
              Stop
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <p className="text-white text-center font-medium text-lg">{instructions}</p>
            <p className="text-white/80 text-center text-sm mt-2">
              Make sure the barcode is clearly visible and well-lit
            </p>
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