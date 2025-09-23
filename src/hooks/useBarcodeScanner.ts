import { useState, useCallback, useEffect } from 'react';

export interface BarcodeScanResult {
  text: string;
  format?: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(true);

  const requestPermissions = useCallback(async () => {
    // For web environment, assume permission is available
    setHasPermission(true);
    return true;
  }, []);

  const scanBarcode = useCallback(async (): Promise<BarcodeScanResult | null> => {
    try {
      setIsScanning(true);
      
      // Try to use web-based camera scanning
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          // Create video element for camera preview
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          // Wait for video to load
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          
          // Create canvas for frame capture
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Scanning loop
          const scanFrame = async (): Promise<BarcodeScanResult | null> => {
            if (!video.videoWidth || !video.videoHeight) {
              return null;
            }
            
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Use jsQR library if available
            if (typeof window !== 'undefined' && (window as any).jsQR) {
              const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });
              
              if (code) {
                stream.getTracks().forEach(track => track.stop());
                return { text: code.data, format: 'camera' };
              }
            }
            
            return null;
          };
          
          // Try scanning for 10 seconds
          const scanTimeout = 10000;
          const scanInterval = 100;
          const maxAttempts = scanTimeout / scanInterval;
          
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const result = await scanFrame();
            if (result) {
              return result;
            }
            await new Promise(resolve => setTimeout(resolve, scanInterval));
          }
          
          // Clean up camera
          stream.getTracks().forEach(track => track.stop());
          
        } catch (cameraError) {
          console.log('Camera not available, falling back to manual input');
        }
      }
      
      // Fallback to manual input
      const text = prompt('Enter barcode manually:');
      
      if (text && text.trim()) {
        return { text: text.trim(), format: 'manual' };
      }
      return null;
    } catch (error) {
      console.error('Barcode scanning error:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(async () => {
    setIsScanning(false);
  }, []);

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
  };
};