import { useState, useCallback, useEffect } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';

export interface BarcodeScanResult {
  text: string;
  format?: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermissions = useCallback(async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web development, we'll assume permission is granted
        setHasPermission(true);
        return true;
      }

      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        setHasPermission(true);
        return true;
      }
      
      if (status.denied) {
        setHasPermission(false);
        return false;
      }

      if (status.asked) {
        // Wait for user response
        const newStatus = await BarcodeScanner.checkPermission({ force: false });
        const granted = newStatus.granted;
        setHasPermission(granted);
        return granted;
      }

      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const scanBarcode = useCallback(async (): Promise<BarcodeScanResult | null> => {
    try {
      setIsScanning(true);

      if (!Capacitor.isNativePlatform()) {
        // Web fallback - show manual input for now
        const text = prompt('Enter barcode manually (scanner not available in web preview):');
        if (text) {
          return { text, format: 'manual' };
        }
        return null;
      }

      // Check permission first
      const permissionGranted = hasPermission ?? await requestPermissions();
      
      if (!permissionGranted) {
        throw new Error('Camera permission is required to scan barcodes');
      }

      // Hide the web content to show camera
      document.body.classList.add('scanner-active');

      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        return {
          text: result.content,
          format: result.format
        };
      }

      return null;
    } catch (error) {
      console.error('Barcode scanning error:', error);
      throw error;
    } finally {
      setIsScanning(false);
      // Restore web content visibility
      document.body.classList.remove('scanner-active');
      if (Capacitor.isNativePlatform()) {
        BarcodeScanner.stopScan();
      }
    }
  }, [hasPermission, requestPermissions]);

  const stopScanning = useCallback(async () => {
    try {
      setIsScanning(false);
      document.body.classList.remove('scanner-active');
      
      if (Capacitor.isNativePlatform()) {
        await BarcodeScanner.stopScan();
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }, []);

  // Check initial permission status
  useEffect(() => {
    const checkInitialPermission = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await BarcodeScanner.checkPermission({ force: false });
          setHasPermission(status.granted);
        } catch (error) {
          console.error('Error checking initial permission:', error);
          setHasPermission(false);
        }
      } else {
        // Web environment - assume permission available
        setHasPermission(true);
      }
    };

    checkInitialPermission();
  }, []);

  return {
    scanBarcode,
    stopScanning,
    isScanning,
    hasPermission,
    requestPermissions,
  };
};