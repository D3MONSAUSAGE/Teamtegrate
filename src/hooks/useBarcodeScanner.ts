import { useState, useCallback, useEffect } from 'react';

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
      setIsScanning(true);
      
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
      
      // Wait for video to load and start playing
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded, starting playback');
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Video loading timeout')), 5000);
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
      
      // Scanning loop with proper error handling
      const scanFrame = async (): Promise<BarcodeScanResult | null> => {
        try {
          if (!video.videoWidth || !video.videoHeight) {
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
      
      // Try scanning for 30 seconds with better feedback
      const scanTimeout = 30000;
      const scanInterval = 150;
      const maxAttempts = scanTimeout / scanInterval;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (!isScanning) {
          console.log('🛑 Scanning cancelled by user');
          break;
        }
        
        const result = await scanFrame();
        if (result) {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, scanInterval));
      }
      
      console.log('⏱️ Scan timeout reached, no barcode found');
      
      // Should not reach here normally
      return null;
    } catch (error) {
      console.error('❌ Barcode scanning error:', error);
      throw error; // Let the calling component handle the error
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, currentStream]);

  const stopScanning = useCallback(async () => {
    console.log('🛑 Stopping barcode scanner...');
    setIsScanning(false);
    
    // Stop camera stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 Camera track stopped via stopScanning');
      });
      setCurrentStream(null);
    }
    setVideoElement(null);
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