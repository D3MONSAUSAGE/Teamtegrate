import React, { useEffect, useRef, useState } from 'react';
import { X, Flashlight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  hasNativeDetector, 
  startNative, 
  startQuagga, 
  toggleTorch, 
  getCameraStream, 
  stopStream,
  type BarcodeHit 
} from '@/lib/barcode/scannerService';

interface ScannerOverlayProps {
  open: boolean;
  onClose: () => void;
  onBarcode: (text: string) => void;
  continuous?: boolean;
  instructions?: string;
  contextItem?: {
    name: string;
    scannedCount?: number;
  };
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  open,
  onClose,
  onBarcode,
  continuous = true,
  instructions = "Position the barcode within the frame to scan",
  contextItem
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const quaggaMountRef = useRef<HTMLDivElement | null>(null);
  const stopFunctions = useRef<(() => Promise<void>)[]>([]);
  const shouldFallback = useRef<boolean>(false);
  
  const [mode, setMode] = useState<'idle' | 'native' | 'quagga'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string>('');
  const [lastBarcodeTime, setLastBarcodeTime] = useState<number>(0);

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
    
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', vis);
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', popstate);
    };
  }, [open]);

  async function cleanup() {
    // Stop all scanner functions
    for (const stopFn of stopFunctions.current) {
      try {
        await stopFn();
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
    stopFunctions.current = [];

    // Stop video stream
    const video = videoRef.current;
    if (video?.srcObject) {
      await stopStream(video.srcObject as MediaStream);
      video.srcObject = null;
    }

    // Clean up Quagga mount
    if (quaggaMountRef.current) {
      quaggaMountRef.current.innerHTML = '';
    }

    setMode('idle');
  }

  async function handleStart() {
    if (isLoading || mode !== 'idle') return;
    
    setIsLoading(true);
    setError(null);
    await cleanup();

    try {
      // Get camera stream
      const stream = await getCameraStream();
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.autoplay = true;
      await video.play();

      // Try native detector first
      if (hasNativeDetector()) {
        shouldFallback.current = true;
        await tryNative();
        // Give native a chance, fallback after 2.5s if no results
        setTimeout(() => {
          if (shouldFallback.current) {
            tryQuagga();
          }
        }, 2500);
      } else {
        await tryQuagga();
      }

    } catch (e: any) {
      const errorMsg = e?.message ?? 'Camera access failed';
      setError(getCameraErrorMessage(errorMsg));
    } finally {
      setIsLoading(false);
    }
  }

  async function tryNative() {
    const video = videoRef.current;
    if (!video) return;

    try {
      setMode('native');
      const stopFn = await startNative({
        videoEl: video,
        onResult: handleBarcodeHit,
        preferredFormats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        throttleMs: 120
      });
      stopFunctions.current.push(stopFn);
    } catch (e) {
      console.error('Native scanner failed:', e);
      tryQuagga();
    }
  }

  async function tryQuagga() {
    const mountEl = quaggaMountRef.current;
    if (!mountEl) return;

    try {
      setMode('quagga');
      const stopFn = await startQuagga({
        mountEl,
        onResult: handleBarcodeHit,
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader', 'code_39_reader'],
        frequency: 10
      });
      stopFunctions.current.push(stopFn);
    } catch (e: any) {
      setError('Scanner fallback failed. Use manual entry below.');
      console.error('Quagga scanner failed:', e);
    }
  }

  function handleBarcodeHit(hit: BarcodeHit) {
    const now = Date.now();
    
    // Disable fallback once we get a result
    shouldFallback.current = false;
    
    // Debounce duplicate scans within 1 second
    if (hit.text === lastBarcode && now - lastBarcodeTime < 1000) {
      return;
    }

    setLastBarcode(hit.text);
    setLastBarcodeTime(now);

    // Haptic feedback
    try {
      navigator.vibrate?.(30);
    } catch {}

    // Normalize barcode
    const normalized = hit.text.trim().replace(/\s+/g, '');
    onBarcode(normalized);
    
    if (!continuous) {
      handleClose();
    }
  }

  function handleClose() {
    setIsClosing(true);
    onClose(); // Call onClose first to immediately hide overlay
    cleanup();
  }

  async function handleToggleFlash() {
    const video = videoRef.current;
    if (!video) return;

    try {
      const success = await toggleTorch(video, !flashEnabled);
      if (success) {
        setFlashEnabled(!flashEnabled);
      }
    } catch (e) {
      console.log('Flash not supported on this device');
    }
  }

  function getCameraErrorMessage(errorMsg: string): string {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
      return isMobile 
        ? 'Camera access denied. Please tap "Allow" when prompted, or enable camera in your browser settings.'
        : 'Camera access denied. Please allow camera permissions and try again.';
    }
    if (errorMsg.includes('NotFoundError')) {
      return 'No camera found on this device.';
    }
    if (errorMsg.includes('OverconstrainedError')) {
      return isMobile 
        ? 'Camera not available. Try using your phone\'s back camera or enter the barcode manually below.'
        : 'Camera configuration not supported. Try a different device.';
    }
    if (errorMsg.includes('SecurityError')) {
      return 'Camera access requires a secure connection (HTTPS).';
    }
    return isMobile 
      ? 'Camera not available. Please enter the barcode manually below.'
      : 'Unable to start camera. Please try again.';
  }

  // Reset states when open prop changes
  useEffect(() => { 
    if (!open) {
      cleanup();
      setIsClosing(false);
    } else {
      setIsClosing(false);
    }
  }, [open]);

  if (!open || isClosing) return null;

  // Check if we're on mobile browser
  const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return (
    <div 
      className={`fixed z-50 bg-black ${
        isMobileBrowser 
          ? 'inset-x-0 top-0 h-[70vh] rounded-b-lg' 
          : 'inset-0'
      }`}
      onClick={(e) => {
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
        
        {/* Quagga mount point (hidden behind video) */}
        <div 
          ref={quaggaMountRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: -1 }}
        />
        
        {/* Fallback if no video */}
        {mode === 'idle' && !error && (
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
        {/* Context Strip - Show current item info on mobile */}
        {isMobileBrowser && contextItem && (
          <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-3 border-b border-white/10">
            <div className="text-center">
              <p className="text-white font-medium text-sm">{contextItem.name}</p>
              {contextItem.scannedCount !== undefined && (
                <p className="text-white/70 text-xs">Scanned: {contextItem.scannedCount}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className={`absolute left-4 right-4 flex justify-between items-center ${
          isMobileBrowser && contextItem ? 'top-16' : 'top-4'
        }`}>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleClose}
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm px-4 py-3 touch-manipulation min-h-[48px] min-w-[48px]"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={handleToggleFlash}
            className={`bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm px-4 py-3 touch-manipulation min-h-[48px] min-w-[48px] ${
              flashEnabled ? 'bg-primary/80 text-primary-foreground' : ''
            }`}
          >
            <Flashlight className="h-6 w-6" />
          </Button>
        </div>

        {/* Scanning frame - centered */}
        <div className={`absolute inset-0 flex items-center justify-center ${
          isMobileBrowser && contextItem ? 'pt-16' : ''
        }`}>
          <div 
            className="relative w-64 h-64 md:w-80 md:h-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-black/30 border-2 border-primary/50 rounded-lg">
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning line animation */}
              {(mode === 'native' || mode === 'quagga') && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="grid grid-cols-1 gap-3 mb-4">
            <Button
              className="px-6 py-4 text-lg rounded-lg bg-white text-black font-medium hover:bg-gray-100 touch-manipulation min-h-[48px]"
              onClick={handleStart}
              disabled={mode !== 'idle' || isLoading}
            >
              {isLoading ? 'Starting...' : mode !== 'idle' ? `Scanning (${mode})` : 'Start Camera'}
            </Button>
            
            {mode !== 'idle' && (
              <Button
                variant="outline"
                className="px-6 py-4 text-lg rounded-lg bg-white/10 text-white border-white/20 hover:bg-white/20 touch-manipulation min-h-[48px]"
                onClick={() => cleanup()}
              >
                Stop Scanner
              </Button>
            )}
            
            <Button
              variant="outline"
              className="px-6 py-4 text-lg rounded-lg bg-red-500/20 text-white border-red-500/30 hover:bg-red-500/30 touch-manipulation min-h-[48px]"
              onClick={handleClose}
            >
              Close Scanner
            </Button>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <p className="text-white text-center font-medium text-lg">{instructions}</p>
            <p className="text-white/80 text-center text-sm mt-2">
              Looking for UPC/EAN/Code128/QR codes...
            </p>
            
            <Input
              type="text"
              placeholder="Enter barcode manually"
              className="w-full mt-3 p-3 rounded-lg bg-white/90 text-black placeholder-gray-500 text-lg touch-manipulation"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const normalized = e.currentTarget.value.trim().replace(/\s+/g, '');
                  onBarcode(normalized);
                  e.currentTarget.value = '';
                  if (!continuous) handleClose();
                }
              }}
            />
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