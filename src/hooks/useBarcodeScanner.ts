import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// jsQR removed to fix memory issues

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
        // Web fallback - simplified camera input
        throw new Error('Web barcode scanning temporarily disabled. Please enter barcode manually.');
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

// Helper function removed - jsQR dependency removed to fix memory issues