import { useState, useCallback } from 'react';

export interface BarcodeScanResult {
  text: string;
  format?: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(false);

  const requestPermissions = useCallback(async () => {
    setHasPermission(false);
    return false;
  }, []);

  const scanBarcode = useCallback(async (): Promise<BarcodeScanResult | null> => {
    throw new Error('Barcode scanning is temporarily disabled. Please enter barcode manually.');
  }, []);

  const stopScanning = useCallback(async () => {
    setIsScanning(false);
  }, []);

  return {
    scanBarcode,
    stopScanning,
    isScanning,
    hasPermission,
    requestPermissions,
  };
};