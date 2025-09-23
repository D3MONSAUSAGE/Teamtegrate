import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan, Loader2 } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ScannerOverlay } from './ScannerOverlay';
import { toast } from 'sonner';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onScanSuccess?: (result: string) => void;
}

export const BarcodeInput: React.FC<BarcodeInputProps> = ({
  value,
  onChange,
  placeholder = "Enter or scan barcode",
  className,
  onScanSuccess
}) => {
  const { scanBarcode, isScanning, stopScanning, hasPermission, requestPermissions } = useBarcodeScanner();
  
  const handleScan = async () => {
    try {
      // Check permissions first
      if (hasPermission === false) {
        const granted = await requestPermissions();
        if (!granted) {
          toast.error('Camera permission is required to scan barcodes');
          return;
        }
      }

      const result = await scanBarcode();
      
      if (result) {
        onChange(result.text);
        onScanSuccess?.(result.text);
        toast.success('Barcode scanned successfully!');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan barcode');
    }
  };

  return (
    <>
      <ScannerOverlay
        isScanning={isScanning}
        onClose={stopScanning}
        instructions="Position the barcode within the frame"
      />
      
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleScan}
          disabled={isScanning}
          className="flex-shrink-0"
        >
          {isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Scan className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
};