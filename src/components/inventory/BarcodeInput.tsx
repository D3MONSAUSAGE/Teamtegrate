import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';
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
  onScanSuccess,
}) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanRequest = () => {
    setShowScanner(true);
  };

  const handleBarcodeScanned = (text: string) => {
    onChange(text);
    onScanSuccess?.(text);
    setShowScanner(false);
    toast.success(`Barcode scanned: ${text}`);
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
          className="shrink-0"
        >
          <Scan className="h-4 w-4" />
        </Button>
      </div>

      <ScannerOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcode={handleBarcodeScanned}
        continuous={false}
        instructions="Position the barcode within the scanning frame"
      />
    </div>
  );
};