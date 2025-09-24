import { useState, useCallback, useEffect, useRef } from 'react';

export interface BarcodeScanResult {
  text: string;
  format?: string;
}

// Extend window interface for jsQR
declare global {
  interface Window {
    jsQR: any;
  }
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(true);
  const scanningRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const requestPermissions = useCallback(async () => {
    try {
      const { success } = await import('@/utils/deviceUtils').then(module => module.requestCameraAccess());
      setHasPermission(success);
      return success;
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const scanBarcode = useCallback(async (stream?: MediaStream): Promise<BarcodeScanResult | null> => {
    try {
      console.log('🎯 Starting barcode scan...');
      setIsScanning(true);
      scanningRef.current = true;
      
      // Use provided stream or request camera access
      let cameraStream = stream;
      if (!cameraStream) {
        const { requestCameraAccess } = await import('@/utils/deviceUtils');
        const result = await requestCameraAccess();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to access camera');
        }
        cameraStream = result.stream!;
      }
      
      console.log('🎥 Camera stream ready:', cameraStream.getVideoTracks().length, 'video tracks');
      setCurrentStream(cameraStream);
      
      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = cameraStream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      
      setVideoElement(video);
      
      // Setup cleanup function
      cleanupRef.current = () => {
        console.log('🧹 Cleaning up barcode scanner...');
        scanningRef.current = false;
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => {
            track.stop();
            console.log('🎥 Camera track stopped via cleanup');
          });
        }
        if (video) {
          video.pause();
          video.srcObject = null;
        }
        setCurrentStream(null);
        setVideoElement(null);
      };
      
      // Wait for video to load and start playing
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded, starting playback');
          video.play().then(resolve).catch(reject);
        };
        video.onerror = (error) => {
          console.error('🎥 Video error:', error);
          reject(error);
        };
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Video loading timeout')), 10000);
      });
      
      console.log('🎥 Video playing, dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Check if jsQR is available
      if (!window.jsQR) {
        console.error('❌ jsQR library not loaded');
        throw new Error('jsQR library not available');
      }
      
      console.log('✅ jsQR library available, starting scan loop');
      
      // Scanning loop with ref-based state checking
      const scanFrame = (): BarcodeScanResult | null => {
        try {
          if (!video.videoWidth || !video.videoHeight || !scanningRef.current) {
            return null;
          }
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code) {
            console.log('🎯 Barcode detected:', code.data);
            return { text: code.data, format: 'camera' };
          }
          
          return null;
        } catch (frameError) {
          console.error('Frame processing error:', frameError);
          return null;
        }
      };
      
      // Scanning loop using requestAnimationFrame for better performance
      return new Promise((resolve) => {
        const startTime = Date.now();
        const maxScanTime = 30000; // 30 seconds
        
        const scan = () => {
          if (!scanningRef.current) {
            console.log('🛑 Scanning cancelled by user');
            resolve(null);
            return;
          }
          
          if (Date.now() - startTime > maxScanTime) {
            console.log('⏱️ Scan timeout reached, no barcode found');
            resolve(null);
            return;
          }
          
          const result = scanFrame();
          if (result) {
            resolve(result);
            return;
          }
          
          // Continue scanning
          requestAnimationFrame(scan);
        };
        
        // Start the scanning loop
        scan();
      });
      
    } catch (error) {
      console.error('❌ Barcode scanning error:', error);
      throw error;
    } finally {
      console.log('🏁 Scan completed, cleaning up...');
      scanningRef.current = false;
      setIsScanning(false);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  }, []);

  const stopScanning = useCallback(async () => {
    console.log('🛑 Stopping barcode scanner via stopScanning...');
    scanningRef.current = false;
    setIsScanning(false);
    
    // Use cleanup function if available
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    } else {
      // Fallback cleanup
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.stop();
          console.log('🎥 Camera track stopped via stopScanning fallback');
        });
        setCurrentStream(null);
      }
      setVideoElement(null);
    }
  }, [currentStream]);

  // Set initial permission state
  useEffect(() => {
    setHasPermission(true);
  }, []);

  return {
    scanBarcode,
    stopScanning,
    isScanning,
    hasPermission,
    requestPermissions,
    videoElement,
    currentStream,
  };
};