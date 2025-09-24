import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan, Loader2 } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ScannerOverlay } from './ScannerOverlay';
import { CameraPermissionDialog } from './CameraPermissionDialog';
import { requestCameraAccess } from '@/utils/deviceUtils';
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
  onScanSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const { scanBarcode, stopScanning, isScanning, videoElement } = useBarcodeScanner();

  const handleScanRequest = () => {
    setShowPermissionDialog(true);
  };

  const handlePermissionGranted = async () => {
    try {
      setIsLoading(true);
      setShowPermissionDialog(false);
      console.log('🎯 Starting barcode scan with permission...');

      // Request camera access first
      const cameraResult = await requestCameraAccess();
      
      if (!cameraResult.success) {
        toast(`Failed to access camera: ${cameraResult.error || 'Unknown error'}`, {
          description: 'Please check your camera permissions and try again.',
        });
        return;
      }

      console.log('📹 Camera access granted, starting scan...');
      const result = await scanBarcode(cameraResult.stream);
      
      if (result) {
        console.log('✅ Barcode scan successful:', result);
        onChange(result.text);
        onScanSuccess?.(result.text);
        toast(`Barcode scanned successfully!`, {
          description: `Detected: ${result.text}`,
        });
      } else {
        console.log('ℹ️ No barcode detected during scan timeout');
        toast('No barcode detected', {
          description: 'Please try again or enter the barcode manually.',
        });
      }
    } catch (error) {
      console.error('❌ Barcode scan error:', error);
      // Don't show error for user cancellation
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('user')) {
        toast(`Scan failed: ${errorMessage}`, {
          description: 'Please try again or enter the barcode manually.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
    toast('Camera access denied', {
      description: 'You can enter the barcode manually in the input field.',
    });
  };

  return (
    <div className="space-y-4">
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
          size="sm"
          onClick={handleScanRequest}
          disabled={isLoading || isScanning}
          className="shrink-0"
        >
          {isLoading || isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Scan className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScannerOverlay
        isScanning={isScanning}
        onClose={stopScanning}
        videoElement={videoElement}
        instructions="Position the barcode within the scanning frame"
      />

      <CameraPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </div>
  );
};