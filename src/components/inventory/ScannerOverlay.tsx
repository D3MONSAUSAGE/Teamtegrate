import React from 'react';
import { X, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScannerOverlayProps {
  isScanning: boolean;
  onClose: () => void;
  onToggleFlash?: () => void;
  flashEnabled?: boolean;
  instructions?: string;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  isScanning,
  onClose,
  onToggleFlash,
  flashEnabled = false,
  instructions = "Position the barcode within the frame to scan"
}) => {
  if (!isScanning) return null;

  return (
    <div className="scanner-overlay">
      {/* Header with close button */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/20 text-white hover:bg-black/40"
        >
          <X className="h-6 w-6" />
        </Button>
        
        {onToggleFlash && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFlash}
            className={cn(
              "bg-black/20 text-white hover:bg-black/40",
              flashEnabled && "bg-primary text-primary-foreground"
            )}
          >
            <Flashlight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Scanning frame */}
      <div className="scanner-frame">
        {/* Corner indicators */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
        
        {/* Scanning line animation */}
        {/* Scanning line animation */}
        <div className="scan-line" />
      </div>

      {/* Instructions */}
      <div className="scanner-instructions">
        <p className="text-white text-center font-medium">{instructions}</p>
        <p className="text-white/80 text-center text-sm mt-1">
          Make sure the barcode is clearly visible and well-lit
        </p>
      </div>

      {/* Animation styles handled by CSS */}
    </div>
  );
};