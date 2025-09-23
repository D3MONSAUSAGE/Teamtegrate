import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';

export interface BarcodeScanResult {
  text: string;
  format?: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermissions = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await BarcodeScanner.checkPermission({ force: true });
        setHasPermission(status.granted);
        return status.granted;
      } else {
        // For web, request camera access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
          return true;
        } catch (error) {
          setHasPermission(false);
          return false;
        }
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const scanBarcode = useCallback(async (): Promise<BarcodeScanResult | null> => {
    if (isScanning) return null;

    try {
      setIsScanning(true);

      // Request permissions if not already granted
      if (hasPermission === null) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('Camera permission not granted');
        }
      }

      if (Capacitor.isNativePlatform()) {
        // Native mobile scanning
        await BarcodeScanner.hideBackground();
        document.body.classList.add('scanner-active');
        
        const result = await BarcodeScanner.startScan();
        
        document.body.classList.remove('scanner-active');
        await BarcodeScanner.showBackground();

        if (result.hasContent) {
          return {
            text: result.content,
            format: result.format
          };
        }
        return null;
      } else {
        // Web fallback using camera and jsQR
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (image.dataUrl) {
          return await decodeQRFromDataUrl(image.dataUrl);
        }
        return null;
      }
    } catch (error: any) {
      console.error('Barcode scanning failed:', error);
      if (error.message && error.message.includes('cancelled')) {
        return null; // User cancelled
      }
      throw error;
    } finally {
      setIsScanning(false);
      if (Capacitor.isNativePlatform()) {
        document.body.classList.remove('scanner-active');
        await BarcodeScanner.showBackground().catch(() => {});
      }
    }
  }, [isScanning, hasPermission, requestPermissions]);

  const stopScanning = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await BarcodeScanner.stopScan();
        document.body.classList.remove('scanner-active');
        await BarcodeScanner.showBackground();
      }
    } catch (error) {
      console.error('Error stopping scan:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    scanBarcode,
    stopScanning,
    isScanning,
    hasPermission,
    requestPermissions,
  };
};

// Helper function to decode QR code from data URL using jsQR
const decodeQRFromDataUrl = async (dataUrl: string): Promise<BarcodeScanResult | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        resolve({
          text: code.data,
          format: 'QR_CODE'
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
};