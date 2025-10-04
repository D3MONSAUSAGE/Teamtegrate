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
    
    // Cleanup before calling onBarcode to prevent race conditions with API calls
    if (!continuous) {
      cleanup().then(() => {
        onBarcode(normalized);
        onClose();
      });
    } else {
      onBarcode(normalized);
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
      className={`fixed z-50 bg-gradient-to-b from-black via-black/95 to-black ${
        isMobileBrowser 
          ? 'inset-x-0 top-0 h-screen' 
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

      {/* Structured Layout - Prevents overlapping */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Top Section: Context Strip + Header Controls */}
        <div className="flex-none">
          {/* Context Strip */}
          {isMobileBrowser && contextItem && (
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-md border-b border-primary/20">
              <div className="px-6 py-3 text-center">
                <p className="text-white font-semibold text-lg">{contextItem.name}</p>
                {contextItem.scannedCount !== undefined && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <p className="text-primary-foreground/80 text-sm font-medium">
                      Scanned: {contextItem.scannedCount}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Header Controls */}
          <div className="flex justify-between items-center p-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClose}
              className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm rounded-full p-3 transition-all duration-200 shadow-lg border border-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handleToggleFlash}
              className={`bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-3 transition-all duration-200 shadow-lg border border-white/10 ${
                flashEnabled 
                  ? 'bg-primary/80 text-primary-foreground border-primary/30' 
                  : 'text-white'
              }`}
            >
              <Flashlight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Middle Section: Scanner Frame */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div 
            className="relative w-64 h-64 md:w-80 md:h-80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main scanning frame with glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border-2 border-primary/40 rounded-2xl shadow-2xl">
              {/* Animated corner brackets */}
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl animate-pulse" />
              <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl animate-pulse" />
              <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl animate-pulse" />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl animate-pulse" />
              
              {/* Enhanced scanning line animation */}
              {(mode === 'native' || mode === 'quagga') && (
                <>
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse opacity-80" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-bounce" 
                       style={{ animationDuration: '2s' }} />
                </>
              )}
              
              {/* Center targeting dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-ping" />
            </div>
          </div>
        </div>

        {/* Bottom Section: Instructions and Controls */}
        <div className="flex-none p-4 space-y-4">
          {/* Instructions */}
          <div className="text-center">
            <p className="text-white font-medium text-lg mb-2">{instructions}</p>
            <div className="flex items-center justify-center gap-2 text-primary-foreground/70 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                mode === 'native' || mode === 'quagga' 
                  ? 'bg-green-400 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
              <span>Looking for UPC/EAN/Code128/QR codes</span>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="space-y-3 max-w-sm mx-auto">
            <Button
              className="w-full px-6 py-4 text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:from-primary/90 hover:to-primary/70 touch-manipulation min-h-[52px] shadow-lg transition-all duration-200"
              onClick={handleStart}
              disabled={mode !== 'idle' || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Starting Camera...
                </div>
              ) : mode !== 'idle' ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Scanning Active
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Start Camera
                </div>
              )}
            </Button>
            
            {mode !== 'idle' && (
              <Button
                variant="outline"
                className="w-full px-6 py-3 text-base rounded-xl bg-white/5 text-white border-white/20 hover:bg-white/10 touch-manipulation min-h-[48px] font-medium transition-all duration-200"
                onClick={() => cleanup()}
              >
                Stop Scanner
              </Button>
            )}
          </div>
        </div>

        {/* Error Display - Fixed position overlay */}
        {error && (
          <div className="absolute inset-x-4 bottom-4">
            <div className="bg-gradient-to-r from-red-500/90 to-red-600/80 backdrop-blur-md rounded-xl p-4 shadow-xl border border-red-400/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-white text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};